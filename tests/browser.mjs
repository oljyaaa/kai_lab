import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:5173");
await page.keyboard.down("w");
await page.waitForTimeout(1000);
await page.keyboard.up("w");
assert.ok(Number(await page.locator("#speed").textContent()) > 0);
await page.locator("#pause").click();
assert.equal(await page.locator("#flight").textContent(), "ПАУЗА");
await page.locator("#reset").click();
await page.locator("#pause").click();
await page.screenshot({ path: "docs/preview-desktop.png", fullPage: true });
const reports = [];
for (const mode of ["fixed", "block", "interval", "variable"]) {
  await page.selectOption("#mode", mode);
  await page.locator("#measure").click();
  await page.waitForFunction(
    () => document.querySelector("#measure").disabled === false,
    { timeout: 20000 },
  );
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download").click();
  const download = await downloadPromise;
  await download.saveAs(`docs/measurement-${mode}.json`);
  reports.push({ mode, summary: await page.locator("#status").textContent() });
}
await page.selectOption("#mode", "fixed");
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({ path: "docs/preview-mobile.png", fullPage: true });
assert.deepEqual(errors, []);
await writeFile(
  "docs/browser-results.json",
  JSON.stringify(
    {
      browser: browser.version(),
      errors,
      reports,
      checks: [
        "keyboard thrust",
        "pause/resume",
        "reset",
        "four measurement modes and JSON downloads",
        "mobile no horizontal overflow",
        "DPR 2 screenshots",
      ],
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(reports, null, 2));
await browser.close();
