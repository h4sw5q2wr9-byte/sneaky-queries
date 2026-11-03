import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
test("three independent phones complete synchronized rounds, refresh, reconnect, replay, and reset", async ({
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  const pages: Page[] = [];
  for (let i = 0; i < 3; i++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
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
    await host.goto("/");
    await expect(
      host.getByRole("heading", { name: "Same friends. Different questions." }),
    ).toBeVisible();
    await host.screenshot({
      path: "test-results/home-mobile.png",
      fullPage: true,
    });
    await host
      .getByRole("button", { name: "Create a party", exact: true })
      .click();
    await host.getByRole("textbox", { name: "Your nickname" }).fill("Host");
    await host.getByRole("combobox", { name: "Room size" }).selectOption("3");
    await host.getByRole("button", { name: "Let’s get sneaky" }).click();
    await expect(host.locator(".room-code")).toBeVisible();
    const code = (await host.locator(".room-code").textContent())!;
    for (const [page, name] of [
      [alice, "Alice"],
      [bob, "Bob"],
    ] as const) {
      await page.goto(`/?room=${code}`);
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
        page.getByRole("heading", { name: "Keep a straight face." }),
      ).toBeVisible();
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
        page.getByRole("heading", { name: "Something doesn’t add up." }),
      ).toBeVisible();
      await expect(page.locator(".answer-card")).toHaveCount(3);
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
        page.getByRole("heading", { name: "Caught in the question." }),
      ).toBeVisible();
      await expect(page.locator(".impostor-card")).toHaveCount(1);
    }
    await host.screenshot({
      path: "test-results/reveal-mobile.png",
      fullPage: true,
    });
    await host.getByRole("button", { name: "Play again", exact: true }).click();
    for (const page of pages)
      await expect(
        page.getByRole("heading", { name: "Keep a straight face." }),
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
      .getByRole("combobox", { name: "Question language" })
      .selectOption("nl");
    await host.getByRole("button", { name: "Save setup" }).click();
    await host.getByRole("button", { name: "Start the round" }).click();
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
