import { test, expect } from "@playwright/test";
import { createOnline, expectScreenFit } from "./helpers";
import type { BrowserContext, Page } from "@playwright/test";
test("three independent phones complete synchronized rounds, refresh, reconnect, replay, and reset", async ({
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  const pages: Page[] = [];
  for (let i = 0; i < 3; i++) {
    const context = await browser.newContext({
      viewport: [
        { width: 320, height: 568 },
        { width: 375, height: 667 },
        { width: 390, height: 844 },
      ][i],
      isMobile: true,
      hasTouch: true,
    });
    contexts.push(context);
    pages.push(await context.newPage());
  }
  const [host, alice, bob] = pages;
  const errors: string[] = [];
  pages.forEach((p) => p.on("pageerror", (e) => errors.push(e.message)));
  try {
    await host.goto("./");
    await expect(
      host.getByRole("heading", { name: "Same friends. Different questions." }),
    ).toBeVisible();
    await host.screenshot({
      path: "test-results/home-mobile.png",
      fullPage: true,
    });
    const code = await createOnline(host, "Host");
    await expectScreenFit(host);
    for (const [page, name] of [
      [alice, "Alice"],
      [bob, "Bob"],
    ] as const) {
      await page.goto(`./?room=${code}`);
      await page.getByRole("textbox", { name: "Your nickname" }).fill(name);
      await page.getByRole("button", { name: "I’m in", exact: true }).click();
      await expect(page.locator(".room-code")).toHaveText(code);
    }
    await expect(host.locator(".player-row")).toHaveCount(3);
    // Independent session-storage identities, rather than three tabs under one UID.
    const authIds = await Promise.all(
      pages.map((page) =>
        page.evaluate(() =>
          Object.values(sessionStorage)
            .filter((v) => v.includes('"uid"'))
            .join(""),
        ),
      ),
    );
    expect(new Set(authIds).size).toBe(3);
    for (const page of pages)
      await page
        .getByRole("button", { name: "I’m ready", exact: true })
        .click();
    await expect(
      host.getByRole("button", { name: "Start the round" }),
    ).toBeEnabled();
    await host.getByRole("button", { name: "Start the round" }).click();
    for (const page of pages)
      await expect(
        page.getByRole("heading", { name: "Your turn." }),
      ).toBeVisible();
    for (const page of pages) await expectScreenFit(page);
    const question = await alice.locator(".question").textContent();
    await alice.reload();
    await expect(alice.locator(".question")).toHaveText(question!);
    for (let i = 0; i < pages.length; i++) {
      await pages[i]
        .getByRole("textbox", { name: "Your answer" })
        .fill(["Bananas", "A tiny wizard", "My homework"][i]);
      await pages[i].getByRole("button", { name: "Lock in my answer" }).click();
      if (i === 0)
        await expect(
          host.getByRole("heading", { name: "Looking innocent?" }),
        ).toBeVisible();
    }
    for (const page of pages) {
      await expect(
        page.getByRole("heading", { name: "Who’s bluffing?" }),
      ).toBeVisible();
      await expect(page.locator(".answer-card")).toHaveCount(3);
      await expectScreenFit(page);
    }
    await expect(
      alice.getByRole("button", { name: "Reveal the impostors" }),
    ).toHaveCount(0);
    await host.screenshot({
      path: "test-results/discussion-mobile.png",
      fullPage: true,
    });
    await host.getByRole("button", { name: "Reveal the impostors" }).click();
    for (const page of pages) {
      await expect(
        page.getByRole("heading", { name: "Caught you." }),
      ).toBeVisible();
      await expect(page.locator(".impostor-card")).toHaveCount(1);
      await expectScreenFit(page);
    }
    await host.screenshot({
      path: "test-results/reveal-mobile.png",
      fullPage: true,
    });
    await host.getByRole("button", { name: "Play again", exact: true }).click();
    for (const page of pages)
      await expect(
        page.getByRole("heading", { name: "Your turn." }),
      ).toBeVisible();
    await contexts[1].setOffline(true);
    await alice.waitForTimeout(700);
    await contexts[1].setOffline(false);
    await expect(
      alice.getByRole("button", { name: "Lock in my answer" }),
    ).toBeVisible();
    await alice
      .getByRole("textbox", { name: "Your answer" })
      .fill("Reconnected");
    await alice.getByRole("button", { name: "Lock in my answer" }).click();
    await expect(
      alice.getByRole("heading", { name: "Looking innocent?" }),
    ).toBeVisible();
    await host.locator("summary").click();
    await host.getByRole("button", { name: "Back to setup" }).click();
    await host.getByRole("button", { name: "Confirm", exact: true }).click();
    for (const page of pages)
      await expect(page.locator(".room-code")).toHaveText(code);
    await host
      .getByRole("button", { name: "Change setup", exact: true })
      .click();
    await host
      .getByRole("combobox", { name: "Language", exact: true })
      .selectOption("nl");
    await expect(alice.locator("html")).toHaveAttribute("lang", "nl");
    await host.getByRole("button", { name: "Verder", exact: true }).click();
    await host
      .getByRole("button", { name: "Instellingen opslaan", exact: true })
      .click();
    await host
      .getByRole("button", { name: "Start de ronde", exact: true })
      .click();
    await expect(host.locator(".question")).toContainText("?");
    for (const page of pages) {
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

test("host loss, takeover, removal, and refilling a vacated seat do not strand a round", async ({
  browser,
}) => {
  test.setTimeout(100000);
  const contexts = await Promise.all(
    Array.from({ length: 4 }, () =>
      browser.newContext({
        viewport: { width: 360, height: 780 },
        isMobile: true,
        hasTouch: true,
      }),
    ),
  );
  const [host, alice, bob, charlie] = await Promise.all(
    contexts.map((c) => c.newPage()),
  );
  try {
    await host.goto("./");
    const code = await createOnline(host, "Original host");
    for (const [page, name] of [
      [alice, "Alice"],
      [bob, "Bob"],
    ] as const) {
      await page.goto(`./?room=${code}`);
      await page.getByRole("textbox", { name: "Your nickname" }).fill(name);
      await page.getByRole("button", { name: "I’m in", exact: true }).click();
      await expect(page.locator(".room-code")).toHaveText(code);
    }
    await charlie.goto(`./?room=${code}`);
    await charlie
      .getByRole("textbox", { name: "Your nickname" })
      .fill("Charlie");
    await charlie.getByRole("button", { name: "I’m in", exact: true }).click();
    await expect(charlie.getByRole("alert")).toContainText(
      "This party is full.",
    );
    for (const page of [host, alice, bob])
      await page
        .getByRole("button", { name: "I’m ready", exact: true })
        .click();
    await host.getByRole("button", { name: "Start the round" }).click();
    await expect(alice.locator(".question")).toBeVisible();
    await contexts[0].setOffline(true);
    for (const page of [alice, bob]) {
      await page
        .getByRole("textbox", { name: "Your answer" })
        .fill("Still here");
      await page.getByRole("button", { name: "Lock in my answer" }).click();
    }
    await expect(
      alice.getByRole("button", { name: "Become host" }),
    ).toBeEnabled({ timeout: 65000 });
    await alice.getByRole("button", { name: "Become host" }).click();
    await alice.locator("summary").click();
    await alice
      .getByRole("button", { name: "Remove Original host", exact: true })
      .click();
    await alice.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(
      alice.getByRole("heading", { name: "Who’s bluffing?" }),
    ).toBeVisible();
    await expect(bob.locator(".answer-card")).toHaveCount(2);
    await alice.getByRole("button", { name: "Reveal the impostors" }).click();
    await expect(
      bob.getByRole("heading", { name: "Caught you." }),
    ).toBeVisible();
    await alice
      .getByRole("button", { name: "Change setup", exact: true })
      .click();
    await charlie.getByRole("button", { name: "I’m in", exact: true }).click();
    await expect(charlie.locator(".room-code")).toHaveText(code);
    await expect(alice.locator(".player-row")).toHaveCount(3);
    await charlie
      .getByRole("button", { name: "I’m ready", exact: true })
      .click();
    await expect(
      alice.getByRole("button", { name: "Start the round" }),
    ).toBeEnabled();
    await alice.getByRole("button", { name: "Start the round" }).click();
    await expect(charlie.locator(".question")).toBeVisible();
    await contexts[0].setOffline(false);
    await expect(
      host.getByRole("heading", { name: "You’re no longer in this party." }),
    ).toBeVisible({ timeout: 15000 });
    await alice.screenshot({
      path: "test-results/takeover-mobile.png",
      fullPage: true,
    });
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
