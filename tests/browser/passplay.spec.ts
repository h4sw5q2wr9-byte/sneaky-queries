import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
async function enterNames(page: Page, names: string[]) {
  await page
    .getByRole("combobox", { name: "Player count", exact: true })
    .selectOption(String(names.length));
  for (let i = 0; i < names.length; i++)
    await page
      .getByRole("textbox", { name: `Player ${i + 1}`, exact: true })
      .fill(names[i]);
}
async function choose(page: Page, name: string) {
  await page
    .getByRole("button", { name: `${name}, Choose your card`, exact: true })
    .click();
  await expect(page.locator(".question")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Reveal my question", exact: true })
    .click();
  await expect(page.locator(".question")).toBeVisible();
  return (await page.locator(".question").textContent())!;
}
async function submit(page: Page, answer: string) {
  await page
    .getByRole("textbox", { name: "Your answer", exact: true })
    .fill(answer);
  await page
    .getByRole("button", { name: "Lock in my answer", exact: true })
    .click();
  await expect(page.locator(".question")).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Back to name cards", exact: true })
    .click();
}

test("Pass & Play completes private turns, safe refresh, discussion, reveal and replay without Firebase", async ({
  page,
  context,
}) => {
  const backendRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /identitytoolkit|securetoken|firebasedatabase|firebaseio\.com/.test(
        request.url(),
      )
    )
      backendRequests.push(
        new URL(request.url()).origin + new URL(request.url()).pathname,
      );
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Pass & Play", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "One phone. All the suspects." }),
  ).toBeVisible();
  await enterNames(page, ["Alice", "Bob", "Cara"]);
  await page
    .getByRole("button", { name: "Deal the questions", exact: true })
    .click();
  await expect(page.locator(".name-card")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Continue to discussion", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: "test-results/passplay-cards-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  const firstQuestion = await choose(page, "Alice");
  await page
    .getByRole("textbox", { name: "Your answer" })
    .fill("Unsubmitted private draft");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Find your name." }),
  ).toBeVisible();
  await expect(page.locator(".question")).toHaveCount(0);
  expect(await choose(page, "Alice")).toBe(firstQuestion);
  await expect(page.getByRole("textbox", { name: "Your answer" })).toHaveValue(
    "",
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
  });
  await expect(
    page.getByRole("heading", { name: "Find your name." }),
  ).toBeVisible();
  await expect(page.locator(".question")).toHaveCount(0);
  const questions: Record<string, string> = {
    Alice: await choose(page, "Alice"),
  };
  await submit(page, "My garden gnome");
  await expect(
    page.getByRole("button", { name: "Alice, Answer locked", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Continue to discussion" }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Alice, Answer locked", exact: true }),
  ).toBeDisabled();
  // A loaded page can complete the local round while the network is unavailable.
  await context.setOffline(true);
  questions.Cara = await choose(page, "Cara");
  await submit(page, "A tiny dragon");
  questions.Bob = await choose(page, "Bob");
  await submit(page, "My homework");
  await expect(page.locator(".name-card.answered")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Continue to discussion" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Continue to discussion" }).click();
  await expect(page.locator(".answer-card")).toHaveCount(3);
  const original = (await page
    .locator(".original-panel .question")
    .textContent())!;
  expect(Object.values(questions).filter((q) => q === original)).toHaveLength(
    2,
  );
  expect(new Set(Object.values(questions)).size).toBe(2);
  await page
    .getByRole("button", { name: "Reveal the impostors", exact: true })
    .click();
  await expect(page.locator(".impostor-card")).toHaveCount(1);
  const impostor = Object.keys(questions).find(
    (name) => questions[name] !== original,
  )!;
  await expect(page.locator(".impostor-card h2")).toHaveText(impostor);
  await expect(page.locator(".revealed-question")).toHaveText(
    questions[impostor],
  );
  await page.screenshot({
    path: "test-results/passplay-reveal-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page.locator(".name-card.answered")).toHaveCount(0);
  await expect(page.getByText("Round 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Change setup", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".name-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Change setup", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Player 1", exact: true }),
  ).toHaveValue("Alice");
  expect(backendRequests).toEqual([]);
  await context.setOffline(false);
});

test("Pass & Play supports seven players, unique variants, Dutch, and narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("./?mode=local");
  await expect(
    page.getByRole("button", { name: "Deal the questions", exact: true }),
  ).toBeDisabled();
  const names = [
    "AlexandervanderBerg",
    "Bo",
    "Chris",
    "Dana",
    "Eli",
    "Fleur",
    "Gio",
  ];
  await enterNames(page, names);
  await page
    .getByRole("textbox", { name: "Player 2", exact: true })
    .fill(" alexandervanderberg ");
  await expect(page.getByRole("alert")).toContainText("different name");
  await expect(
    page.getByRole("button", { name: "Deal the questions" }),
  ).toBeDisabled();
  await page.getByRole("textbox", { name: "Player 2", exact: true }).fill("Bo");
  await page
    .getByRole("combobox", { name: "Impostors", exact: true })
    .selectOption("3");
  await page
    .getByRole("combobox", { name: "Question language", exact: true })
    .selectOption("nl");
  await page
    .getByRole("button", { name: "Deal the questions", exact: true })
    .click();
  const seen: Record<string, string> = {};
  for (const name of names) {
    seen[name] = await choose(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await submit(page, `Antwoord van ${name}`);
  }
  await page.getByRole("button", { name: "Continue to discussion" }).click();
  const original = (await page
    .locator(".original-panel .question")
    .textContent())!;
  expect(Object.values(seen).filter((q) => q === original)).toHaveLength(4);
  await page.getByRole("button", { name: "Reveal the impostors" }).click();
  await expect(page.locator(".impostor-card")).toHaveCount(3);
  expect(
    new Set(await page.locator(".revealed-question").allTextContents()).size,
  ).toBe(3);
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("nl");
  await expect(
    page.getByRole("button", { name: "Opnieuw spelen", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Instellingen wijzigen", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Aantal spelers", exact: true })
    .selectOption("3");
  await expect(
    page.getByRole("combobox", { name: "Impostors", exact: true }),
  ).toHaveValue("1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("choosing one phone from an invitation preserves the local route on refresh", async ({
  page,
}) => {
  await page.goto("./?room=ABC234");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Pass & Play", exact: true }).click();
  await expect(page).toHaveURL(/mode=local/);
  expect(new URL(page.url()).searchParams.has("room")).toBe(false);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "One phone. All the suspects." }),
  ).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem("sq-room", "OLD234"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "One phone. All the suspects." }),
  ).toBeVisible();
});
