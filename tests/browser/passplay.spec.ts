import { test, expect } from "@playwright/test";
import { questions } from "../../src/data/questions";
import {
  choosePrivate,
  expectScreenFit,
  fillLocalNames,
  localOptions,
  submitPrivate,
  text,
} from "./helpers";

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
      backendRequests.push(new URL(request.url()).pathname);
  });
  await page.goto("./");
  const launcher = await page.evaluate(async () => {
    const manifestUrl = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    )!.href;
    const manifest = await (await fetch(manifestUrl)).json();
    const icons = await Promise.all(
      manifest.icons.map(async (icon: { src: string }) => {
        const response = await fetch(new URL(icon.src, manifestUrl));
        const bytes = await response.arrayBuffer();
        const view = new DataView(bytes);
        return {
          ok: response.ok,
          width: view.getUint32(16),
          height: view.getUint32(20),
        };
      }),
    );
    const touch = await fetch(
      document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')!
        .href,
    );
    return {
      display: manifest.display,
      start: new URL(manifest.start_url, manifestUrl).pathname,
      base: new URL("./", location.href).pathname,
      icons,
      touch: touch.ok,
    };
  });
  expect(launcher.display).toBe("standalone");
  expect(launcher.start).toBe(launcher.base);
  expect(launcher.icons).toEqual([
    { ok: true, width: 192, height: 192 },
    { ok: true, width: 512, height: 512 },
  ]);
  expect(launcher.touch).toBe(true);

  await expect(page.locator(".deck-card.front")).toHaveCSS(
    "animation-name",
    "frontFloat",
  );
  await page.getByRole("button", { name: "Pass & Play", exact: true }).click();
  await fillLocalNames(page, ["Alice", "Bob", "Cara"]);
  await localOptions(page);
  await expect(page.getByRole("combobox")).toHaveCount(1); // The one global language choice.
  await page
    .getByRole("button", { name: "Deal the questions", exact: true })
    .click();
  await expect(page.locator(".name-card")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Continue to discussion", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: "test-results/passplay-cards-mobile.png",
    animations: "disabled",
  });
  const first = await choosePrivate(page, "Alice");
  await expect(page.locator(".question-panel")).toHaveCSS(
    "animation-name",
    "cardTurn",
  );
  await page
    .getByRole("textbox", { name: "Your answer" })
    .fill("Unsubmitted private draft");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Who’s next?", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".question")).toHaveCount(0);
  expect(await choosePrivate(page, "Alice")).toBe(first);
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
    page.getByRole("heading", { name: "Who’s next?", exact: true }),
  ).toBeVisible();
  const seen: Record<string, string> = {
    Alice: await choosePrivate(page, "Alice"),
  };
  await submitPrivate(page, "My garden gnome");
  await expect(
    page.getByRole("button", { name: "Alice, Answer locked", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Alice, Answer locked", exact: true }),
  ).toBeDisabled();
  await context.setOffline(true);
  seen.Cara = await choosePrivate(page, "Cara");
  await submitPrivate(page, "A tiny dragon");
  seen.Bob = await choosePrivate(page, "Bob");
  await submitPrivate(page, "My homework");
  await expect(page.locator(".name-card.answered")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Continue to discussion", exact: true })
    .click();
  const original = (await page
    .locator(".original-panel .question")
    .textContent())!;
  expect(Object.values(seen).filter((q) => q === original)).toHaveLength(2);
  await expect(page.locator(".answer-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Reveal the impostors", exact: true })
    .click();
  await expect(page.locator(".impostor-card")).toHaveCount(1);
  const impostor = Object.keys(seen).find((name) => seen[name] !== original)!;
  await expect(page.locator(".impostor-card h2")).toHaveText(impostor);
  await expect(page.locator(".revealed-question")).toHaveText(seen[impostor]);
  await page.screenshot({
    path: "test-results/passplay-reveal-mobile.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page.locator(".name-card.answered")).toHaveCount(0);
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

test("Pass & Play has one language choice, seven players, paged reveals and Dutch questions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("./?mode=local");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("nl");
  const names = [
    "AlexandervanderBerg",
    "Bo",
    "Chris",
    "Dana",
    "Eli",
    "Fleur",
    "Gio",
  ];
  await fillLocalNames(page, names, "nl");
  await localOptions(page, "nl");
  await expect(page.getByRole("combobox")).toHaveCount(1);
  await page
    .getByRole("group", { name: "Impostors", exact: true })
    .getByRole("button", { name: "3", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Deel de vragen uit", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Taal", exact: true }),
  ).toBeDisabled();
  const seen: Record<string, string> = {};
  for (const name of names) {
    seen[name] = await choosePrivate(page, name, "nl");
    await submitPrivate(page, `Antwoord van ${name}`, "nl");
  }
  await page
    .getByRole("button", { name: "Verder naar de discussie", exact: true })
    .click();
  const original = (await page
    .locator(".original-panel .question")
    .textContent())!;
  expect(questions.nl.some((q) => q.original === original)).toBe(true);
  expect(Object.values(seen).filter((q) => q === original)).toHaveLength(4);
  await expect(page.locator(".answer-card")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Volgende pagina", exact: true })
    .click();
  await expect(page.locator(".answer-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Onthul de impostors", exact: true })
    .click();
  const variants = [];
  for (let i = 0; i < 3; i++) {
    variants.push(await page.locator(".revealed-question").textContent());
    if (i < 2)
      await page
        .getByRole("button", { name: "Volgende pagina", exact: true })
        .click();
  }
  expect(new Set(variants).size).toBe(3);
  await page
    .getByRole("button", { name: "Instellingen wijzigen", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Taal", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("combobox", { name: "Aantal spelers", exact: true })
    .selectOption("3");
  await page.getByRole("button", { name: "Verder", exact: true }).click();
  await expect(
    page
      .getByRole("group", { name: "Impostors", exact: true })
      .getByRole("button", { name: "1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("choosing one phone from an invitation preserves the local route on refresh", async ({
  page,
}) => {
  await page.goto("./?room=ABC234");
  await page.getByRole("button", { name: "Back home", exact: true }).click();
  await page.getByRole("button", { name: "Pass & Play", exact: true }).click();
  await expect(page).toHaveURL(/mode=local/);
  expect(new URL(page.url()).searchParams.has("room")).toBe(false);
  await page.evaluate(() => sessionStorage.setItem("sq-room", "OLD234"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Who’s playing?", exact: true }),
  ).toBeVisible();
});

for (const size of [
  { width: 320, height: 568, lang: "en" as const },
  { width: 375, height: 667, lang: "nl" as const },
  { width: 390, height: 844, lang: "en" as const },
])
  test(`Pass & Play fits ${size.width}×${size.height} without page scrolling, including ten players`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    if (size.lang === "nl")
      await page
        .getByRole("combobox", { name: "Language", exact: true })
        .selectOption("nl");
    const t = (key: Parameters<typeof text>[1]) => text(size.lang, key);
    await expectScreenFit(page);
    await expect(page.locator(".deck-card.front")).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.screenshot({
      path: `test-results/home-${size.width}.png`,
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: t("passPlay"), exact: true })
      .click();
    await expectScreenFit(page);
    const names = Array.from({ length: 10 }, (_, i) => `Player ${i + 1}`);
    await fillLocalNames(page, names, size.lang);
    await expectScreenFit(page);
    await localOptions(page, size.lang);
    await expectScreenFit(page);
    await page.screenshot({
      path: `test-results/setup-${size.width}.png`,
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: t("localStart"), exact: true })
      .click();
    await expect(page.locator(".name-card")).toHaveCount(4);
    await expectScreenFit(page);
    await page
      .getByRole("button", { name: t("nextPage"), exact: true })
      .click();
    await expectScreenFit(page);
    await page
      .getByRole("button", { name: t("nextPage"), exact: true })
      .click();
    await expect(page.locator(".name-card")).toHaveCount(2);
    await expectScreenFit(page);
    await choosePrivate(page, names[9], size.lang);
    await expectScreenFit(page);
    await page
      .getByRole("textbox", { name: t("answerLabel"), exact: true })
      .fill("A very long answer ".repeat(8));
    await expectScreenFit(page, true);
    await page.screenshot({
      path: `test-results/question-${size.width}.png`,
      animations: "disabled",
    });
    // Simulate the visual viewport shrinking for an iPhone software keyboard.
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport!, "height", {
        configurable: true,
        get: () => 340,
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    await expect(page.locator(".app-shell")).toHaveAttribute(
      "data-keyboard",
      "true",
    );
    await expectScreenFit(page, true);
    await expect(
      page.getByRole("button", { name: t("lockAnswer"), exact: true }),
    ).toBeInViewport();
  });
