import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { translate } from "../../src/lib/i18n";
import type { StringKey } from "../../src/lib/i18n";
import type { Locale } from "../../src/lib/types";
export const text = (locale: Locale, key: StringKey) => translate(locale, key);
export async function fillLocalNames(
  page: Page,
  names: string[],
  locale: Locale = "en",
) {
  await page
    .getByRole("combobox", {
      name: text(locale, "localPlayerCount"),
      exact: true,
    })
    .selectOption(String(names.length));
  for (let i = 0; i < names.length; i++) {
    await page
      .getByRole("textbox", {
        name: text(locale, "localPlayerName").replace("{n}", String(i + 1)),
        exact: true,
      })
      .fill(names[i]);
    if ((i + 1) % 4 === 0 && i + 1 < names.length)
      await page
        .getByRole("button", { name: text(locale, "nextPlayers"), exact: true })
        .click();
  }
}
export async function localOptions(page: Page, locale: Locale = "en") {
  await page
    .getByRole("button", { name: text(locale, "nextStep"), exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: text(locale, "impostors"), exact: true }),
  ).toBeVisible();
}
export async function findName(
  page: Page,
  name: string,
  locale: Locale = "en",
) {
  const target = page.getByRole("button", {
    name: `${name}, ${text(locale, "localChooseName")}`,
    exact: true,
  });
  for (let i = 0; i < 8; i++) {
    if (await target.count()) return target;
    const next = page.getByRole("button", {
      name: text(locale, "nextPage"),
      exact: true,
    });
    if (await next.isEnabled()) await next.click();
    else {
      const previous = page.getByRole("button", {
        name: text(locale, "previousPage"),
        exact: true,
      });
      while (await previous.isEnabled()) await previous.click();
    }
  }
  throw new Error("Player card was not reachable through the pager.");
}
export async function choosePrivate(
  page: Page,
  name: string,
  locale: Locale = "en",
) {
  await (await findName(page, name, locale)).click();
  await expect(page.locator(".question")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: text(locale, "localRevealQuestion"),
      exact: true,
    })
    .click();
  await expect(page.locator(".question")).toBeVisible();
  return (await page.locator(".question").textContent())!;
}
export async function submitPrivate(
  page: Page,
  answer: string,
  locale: Locale = "en",
) {
  await page
    .getByRole("textbox", { name: text(locale, "answerLabel"), exact: true })
    .fill(answer);
  await page
    .getByRole("button", { name: text(locale, "lockAnswer"), exact: true })
    .click();
  await expect(page.locator(".question")).toHaveCount(0);
  await expect(
    page.getByRole("textbox", {
      name: text(locale, "answerLabel"),
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: text(locale, "localBackToCards"),
      exact: true,
    })
    .click();
}
export async function createOnline(page: Page, nickname: string, capacity = 3) {
  await page.getByRole("button", { name: "Online party", exact: true }).click();
  await page
    .getByRole("button", { name: "Create a party", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Your nickname", exact: true })
    .fill(nickname);
  await page
    .getByRole("combobox", { name: "Room size", exact: true })
    .selectOption(String(capacity));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("button", { name: "Let’s get sneaky", exact: true })
    .click();
  await expect(page.locator(".room-code")).toBeVisible();
  return (await page.locator(".room-code").textContent())!;
}
export async function expectScreenFit(page: Page, allowInternalScroll = false) {
  // Measure the settled screen, including 3D card flips. Ignore infinite decoration.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect?.getComputedTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  const result = await page.evaluate(() => {
    const height = window.visualViewport?.height || innerHeight;
    const top = window.visualViewport?.offsetTop || 0;
    const visible = (el: Element) => el.getClientRects().length > 0;
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".action-dock button, .app-header select",
      ),
    ).filter(visible);
    return {
      horizontal: document.documentElement.scrollWidth > innerWidth + 1,
      documentScroll:
        document.documentElement.scrollHeight > innerHeight + 1 ||
        document.body.scrollHeight > innerHeight + 1 ||
        scrollY !== 0,
      clippedActions: controls
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.bottom > top + height + 1 || r.top < top - 1;
        })
        .map((el) => el.getAttribute("aria-label") || el.textContent),
      internal: Array.from(
        document.querySelectorAll<HTMLElement>(
          ".scroll-region, .name-card-grid",
        ),
      )
        .filter(visible)
        .filter((el) => el.scrollHeight > el.clientHeight + 3)
        .map((el) => el.className),
    };
  });
  if (result.clippedActions.length) {
    await page.screenshot({ path: "test-results/clipped-actions.png" });
    console.log(
      await page
        .locator(".question-screen, .question-panel, .action-dock, .manage")
        .evaluateAll((elements) =>
          elements.map((el) => ({
            class: el.className,
            rect: el.getBoundingClientRect().toJSON(),
          })),
        ),
    );
  }
  expect(result.horizontal).toBe(false);
  expect(result.documentScroll).toBe(false);
  expect(result.clippedActions).toEqual([]);
  if (!allowInternalScroll) expect(result.internal).toEqual([]);
}
