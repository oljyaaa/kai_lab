import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
assert.match(await page.locator("header small").textContent(), /LAB 02/);
assert.equal(await page.locator("#entities").textContent(), "10");
await page.keyboard.press("Space");
await page.waitForFunction(() =>
  document.querySelector("#status").textContent.includes("Куля створена"),
);
assert.match(await page.locator("#status").textContent(), /Куля створена/);
await page.locator("#controls").selectOption("arrows");
await page.keyboard.down("ArrowUp");
await page.waitForTimeout(250);
await page.keyboard.up("ArrowUp");
assert.equal(await page.locator("#controls").inputValue(), "arrows");
await page.setViewportSize({ width: 390, height: 844 });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
assert.deepEqual(errors, []);
console.log("PASS: Lab 02 direct game, shooting, arrows, mobile, no errors.");
await browser.close();
