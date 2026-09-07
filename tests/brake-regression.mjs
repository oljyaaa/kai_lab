import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5173");
  const speed = async () => Number(await page.locator("#speed").textContent());
  async function hold(key, ms) {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
  }
  async function accelerate() {
    await page.locator("#reset").click();
    await page.locator("canvas").click();
    await hold("w", 700);
    assert.ok((await speed()) > 50);
  }
  for (const button of ["theme", "pause"]) {
    await accelerate();
    await page.locator(`#${button}`).click();
    if (button === "pause") await page.locator("#pause").click();
    const before = await speed();
    await hold("s", 500);
    assert.ok(
      (await speed()) < before * 0.25,
      `S must brake after ${button}: ${before} -> ${await speed()}`,
    );
  }
  await page.locator("#reset").click();
  await hold("w", 700);
  assert.ok((await speed()) > 50, "W works with reset button focused");
  const before = await speed();
  // Physical S on Ukrainian keyboard produces і; e.code remains KeyS.
  await page.keyboard.down("w");
  await page.evaluate(() =>
    document.activeElement.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "і",
        code: "KeyS",
        bubbles: true,
        cancelable: true,
      }),
    ),
  );
  await page.waitForTimeout(500);
  assert.ok(
    (await speed()) < before * 0.25,
    "physical S overrides held W on Ukrainian layout",
  );
  await page.evaluate(() =>
    document.activeElement.dispatchEvent(
      new KeyboardEvent("keyup", { key: "і", code: "KeyS", bubbles: true }),
    ),
  );
  await page.waitForTimeout(500);
  assert.ok((await speed()) > 40, "releasing S restores W thrust");
  await page.keyboard.up("w");
  await page.selectOption("#controls", "arrows");
  await page.locator("#reset").click();
  await hold("ArrowUp", 600);
  const arrowsBefore = await speed();
  assert.ok(arrowsBefore > 40);
  await hold("ArrowDown", 500);
  assert.ok((await speed()) < arrowsBefore * 0.25);
  await page.locator("#controls").focus();
  assert.equal(
    await page.locator("#controls").evaluate((select) => {
      const event = new KeyboardEvent("keydown", {
        code: "ArrowUp",
        key: "ArrowUp",
        bubbles: true,
        cancelable: true,
      });
      select.dispatchEvent(event);
      return event.defaultPrevented;
    }),
    false,
    "game must not prevent select arrow key default action",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: brake after theme/pause/reset, Ukrainian physical S, W+S priority and release, arrow brake, select event not intercepted, no page errors",
  );
} finally {
  await browser.close();
}
