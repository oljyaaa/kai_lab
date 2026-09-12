import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:5173");
  const trail = page.locator("#trail-toggle");
  const interpolation = page.locator("#interpolation-toggle");
  await trail.uncheck();
  await interpolation.check();
  await page.locator("canvas").click();
  await page.keyboard.down("w");
  await page.keyboard.down("d");
  await page.waitForTimeout(800);
  await page.keyboard.up("d");
  await page.keyboard.up("w");
  const markerPixels = await page.locator("canvas").evaluate((canvas) => {
    const pixels = canvas
      .getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height).data;
    let blue = 0;
    let yellow = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const [red, green, blueChannel] = [
        pixels[i],
        pixels[i + 1],
        pixels[i + 2],
      ];
      if (red < 120 && green > 150 && blueChannel > 210) blue++;
      if (red > 220 && green > 140 && blueChannel < 60) yellow++;
    }
    return { blue, yellow };
  });
  assert.ok(markerPixels.blue > 10, "previous marker must be drawn");
  assert.ok(markerPixels.yellow > 10, "interpolated marker must be drawn");
  await trail.check();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "docs/preview-overlays.png", fullPage: true });
  await page.reload();
  assert.equal(await trail.isChecked(), true);
  assert.equal(await interpolation.isChecked(), true);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: trail and interpolation toggles render, persist, and produce diagnostic markers.",
  );
} finally {
  await browser.close();
}
