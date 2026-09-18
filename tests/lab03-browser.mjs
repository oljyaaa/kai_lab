import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
assert.equal(await page.locator("#join").isEnabled(), true);
await page.locator("#join").click();
await page.locator("#game").waitFor({ state: "visible" });
await page.keyboard.press("Space");
await page.waitForFunction(() =>
  document.querySelector("#status").textContent.includes("куля створена"),
);
assert.match(await page.locator("#status").textContent(), /куля створена/);
await page.getByRole("button", { name: "404 спрайт" }).click();
await page.waitForFunction(() =>
  document.querySelector("#status").textContent.includes("HttpError"),
);
assert.match(await page.locator("#status").textContent(), /HttpError/);
await page.getByRole("button", { name: "Битий JSON" }).click();
await page.waitForFunction(() =>
  document.querySelector("#status").textContent.includes("SyntaxError"),
);
assert.match(await page.locator("#status").textContent(), /SyntaxError/);
const timing = await page.evaluate(async () => {
  const urls = [
    "assets/arena.json",
    "assets/sounds/fire.wav",
    "assets/sounds/hit.wav",
  ];
  const load = (url) => fetch(url).then((response) => response.arrayBuffer());
  const sequentialStart = performance.now();
  for (const url of urls) await load(url);
  const sequentialMs = performance.now() - sequentialStart;
  const concurrentStart = performance.now();
  await Promise.all(urls.map(load));
  return { sequentialMs, concurrentMs: performance.now() - concurrentStart };
});
await page.setViewportSize({ width: 390, height: 844 });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
await page.screenshot({ path: "docs/lab-03-preview.png", fullPage: true });
assert.deepEqual(errors, []);
await writeFile(
  "docs/lab-03-browser-results.json",
  JSON.stringify(
    {
      errors,
      timing,
      checks: [
        "lobby",
        "loadAll",
        "keyboard fire",
        "404",
        "bad json",
        "mobile",
      ],
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(timing));
await browser.close();
