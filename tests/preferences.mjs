import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5173");
await page.locator("canvas").click();
await page.keyboard.down("w");
await page.waitForTimeout(700);
await page.keyboard.up("w");
const speed = Number(await page.locator("#speed").textContent());
assert.ok(speed > 50);
await page.keyboard.down("s");
await page.waitForTimeout(500);
await page.keyboard.up("s");
assert.ok(Number(await page.locator("#speed").textContent()) < speed / 2);
await page.locator("#reset").click();
await page.selectOption("#controls", "arrows");
await page.keyboard.down("w");
await page.waitForTimeout(200);
await page.keyboard.up("w");
assert.equal(await page.locator("#speed").textContent(), "0");
await page.keyboard.down("ArrowUp");
await page.waitForTimeout(500);
await page.keyboard.up("ArrowUp");
assert.ok(Number(await page.locator("#speed").textContent()) > 30);
await page.locator("#pause").click();
await page.locator("#theme").click();
assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
assert.equal(
  await page
    .locator(".card")
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor),
  "rgb(53, 35, 61)",
);
await page.screenshot({ path: "docs/preview-dark.png", fullPage: true });
assert.ok(
  await page
    .locator("canvas")
    .evaluate(
      (canvas) => canvas.getContext("2d").getImageData(0, 0, 1, 1).data[3] > 0,
    ),
);
await page.reload();
assert.equal(await page.locator("#controls").inputValue(), "arrows");
assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
await page.locator("#theme").click();
await page.selectOption("#controls", "touch");
await page.locator("#reset").click();
assert.ok(await page.locator(".touch").isVisible());
const thrust = page.locator('[data-control="thrust"]');
const rect = await thrust.boundingBox();
await page.mouse.move(rect.x + 15, rect.y + 15);
await page.mouse.down();
await page.waitForTimeout(500);
await page.mouse.up();
assert.ok(Number(await page.locator("#speed").textContent()) > 30);
await page.selectOption("#controls", "wasd");
assert.equal(await page.locator(".touch").isVisible(), false);
await page.locator("#reset").click();
await page.waitForTimeout(1100);
await page.screenshot({ path: "docs/preview-desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.selectOption("#controls", "touch");
await page.waitForTimeout(300);
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({ path: "docs/preview-mobile.png", fullPage: true });
assert.deepEqual(errors, []);
console.log(
  "PASS: WASD, brake, arrows, inactive keys, theme while paused, persistence, pointer controls, mobile overflow, no runtime errors.",
);
await browser.close();
