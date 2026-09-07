import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:5173");
const client = await page.context().newCDPSession(page);
const results = [];
for (const mode of ["fixed", "variable"])
  for (const rate of [1, 6]) {
    await client.send("Emulation.setCPUThrottlingRate", { rate });
    const result = await page.evaluate(
      async ({ mode, rate }) => {
        const { integrate, createShip } = await import("/src/sim/ship.js");
        let ship = createShip(),
          last,
          total = 0,
          accumulator = 0,
          steps = 0,
          frames = 0;
        return new Promise((resolve) => {
          function frame(now) {
            if (last === undefined) last = now;
            const dt = Math.min((now - last) / 1000, 5 - total);
            last = now;
            total += dt;
            frames++;
            if (mode === "fixed") {
              accumulator += dt;
              while (accumulator + 1e-12 >= 1 / 60) {
                ship = integrate(ship, { thrust: true }, 1 / 60);
                accumulator -= 1 / 60;
                steps++;
              }
            } else if (dt > 0) {
              ship = integrate(ship, { thrust: true }, dt);
              steps++;
            }
            if (total >= 5 - 1e-9)
              resolve({ mode, rate, frames, steps, x: ship.x, y: ship.y });
            else requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        });
      },
      { mode, rate },
    );
    results.push(result);
  }
await writeFile(
  "docs/throttle-results.json",
  JSON.stringify(
    {
      browser: browser.version(),
      methodology:
        "Headless Chrome, CDP CPU throttling 1x/6x, rAF, exactly 5 simulated seconds, scripted constant thrust, no arena wrapping or delta clamp in measurement harness.",
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results));
await browser.close();
