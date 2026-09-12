import "./style.css";
import { createInput } from "./input.js";
import { createLoop } from "./loop.js";
import { createCanvas } from "./render/canvas.js";
import { draw } from "./render/draw.js";
import { interpolate, wrapShip } from "./sim/arena.js";
import { createShip, integrate } from "./sim/ship.js";
import { appendTrail } from "./sim/trail.js";

document.querySelector("#app").innerHTML =
  `<header><div><h1>✿ Glitter FPV</h1><small>КЛУБ РОЖЕВИХ ПОЛЬОТІВ</small></div><span class="pill">♡ Лабораторна 01 · вільний політ</span></header><main><div class="intro"><div><h2>Маленький дрон. Велика пригода ✧</h2><p>Лови блискітки поглядом і малюй у небі свій маршрут.</p></div><span class="pill">✦ Пастельна арена</span></div><div class="layout"><section class="stage"><div class="stage-top"><span>● GLITTER GARDEN</span><span id="flight">ПОЛІТ АКТИВНИЙ</span></div><canvas aria-label="Арена польоту FPV-дрона. W — тяга, A та D — поворот."></canvas><div class="stage-bottom"><span>✧ Краї арени з’єднані — лети без меж</span><span>FPV / 01</span></div><div class="touch"><button data-control="left" aria-label="Повернути ліворуч">↶</button><button data-control="thrust" aria-label="Тяга">↑ Тяга</button><button data-control="right" aria-label="Повернути праворуч">↷</button></div></section><aside><section class="card"><h3>♡ Твій дрон</h3><span class="badge">BOW-01 · рожевий квадрокоптер</span><div class="metrics"><div><b id="speed">0</b><span>швидкість, од/с</span></div><div><b id="steps">0</b><span>steps/s</span></div><div><b id="fps">0</b><span>frames/s</span></div><div><b id="ms">0</b><span>час кадру, ms</span></div></div></section><section class="card controls"><h3>Готова до зльоту?</h3><p><span>Тяга вперед</span><kbd>W / ↑</kbd></p><p><span>Повернути</span><span><kbd>A</kbd> <kbd>D</kbd></span></p><p><span>Почати спочатку</span><kbd>R</kbd></p><div class="actions"><button id="pause">Пауза</button><button id="reset" class="secondary">На старт</button></div><p class="hint">Відпусти тягу — дрон плавно сповільниться.</p></section></aside></div><section class="card lab"><label for="mode">✦ Лабораторія польоту</label><select id="mode"><option value="fixed">Норма · fixed 60 Hz + rAF</option><option value="block">Експеримент 1 · блок 100 ms</option><option value="interval">Експеримент 2 · setInterval 16 ms</option><option value="variable">Експеримент 3 · змінний крок</option></select><button id="measure">Виміряти 10 секунд</button><button class="secondary" id="download" disabled>Завантажити JSON</button><p id="status" role="status">Обери режим, щоб порівняти плавність польоту.</p></section><footer>Зроблено з ♡ · Vanilla JavaScript + Canvas · навчальний прототип, вигляд згори</footer></main>`;
const input = createInput(window);
const surface = createCanvas(document.querySelector("canvas"));
let current = createShip(),
  previous = current,
  loop,
  paused = false,
  mode = "fixed",
  measuring = false,
  samples = [],
  result = null,
  started = 0,
  frameCount = 0;
let simulationTime = 0;
let trail = [];
const touch = new Set();
const $ = (id) => document.getElementById(id);
const preferences = {
  read(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Settings still work without storage. */
    }
  },
};
let theme =
  preferences.read("glitter-theme", "light") === "dark" ? "dark" : "light";
let scheme = preferences.read("glitter-controls", "wasd");
let showTrail = preferences.read("glitter-show-trail", "true") === "true";
let showInterpolation =
  preferences.read("glitter-show-interpolation", "false") === "true";
if (!["wasd", "arrows", "touch"].includes(scheme)) scheme = "wasd";
document
  .querySelector("header")
  .insertAdjacentHTML(
    "beforeend",
    '<button id="theme" class="secondary" aria-pressed="false">☾ Нічна тема</button>',
  );
document.querySelector(".controls").innerHTML =
  `<h3>Пульт керування</h3><label for="controls">Спосіб керування</label><select id="controls"><option value="wasd">Клавіатура · WASD</option><option value="arrows">Клавіатура · стрілки</option><option value="touch">Екранні кнопки</option></select><div id="key-guide"></div><div class="actions"><button id="pause">Пауза</button><button id="reset" class="secondary">На старт</button></div><p class="hint">Обери схему та керуй дроном. Tab переміщує фокус між налаштуваннями.</p>`;
document
  .querySelector("aside")
  .insertAdjacentHTML(
    "beforeend",
    `<section class="card overlays"><h3>Візуальна лабораторія</h3><label><input id="trail-toggle" type="checkbox"> Привид маршруту <span>останні 10 с</span></label><label><input id="interpolation-toggle" type="checkbox"> Показати інтерполяцію</label><p class="hint">Точки показують попередній, поточний та проміжний стан.</p></section>`,
  );
document
  .querySelector(".touch")
  .insertAdjacentHTML(
    "beforeend",
    '<button data-control="brake" aria-label="Гальмувати">↓ Гальмо</button>',
  );
const canvas = document.querySelector("canvas");
canvas.tabIndex = 0;
function overlay() {
  return {
    showTrail,
    showInterpolation,
    trail,
    previous,
    current,
  };
}
function paint() {
  surface.prepare();
  draw(
    surface.ctx,
    current,
    loop?.stats || { stepsPerSecond: 0, framesPerSecond: 0, frameMs: 0 },
    performance.now() / 1000,
    theme,
    overlay(),
  );
  $("speed").textContent = Math.hypot(current.vx, current.vy).toFixed(0);
}
function applyOverlays() {
  $("trail-toggle").checked = showTrail;
  $("interpolation-toggle").checked = showInterpolation;
  paint();
}
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  $("theme").textContent = theme === "dark" ? "☀ Денна тема" : "☾ Нічна тема";
  $("theme").setAttribute("aria-pressed", String(theme === "dark"));
  paint();
}
function applyScheme() {
  input.setScheme(scheme);
  touch.clear();
  $("controls").value = scheme;
  document.querySelector(".touch").hidden = scheme !== "touch";
  $("key-guide").innerHTML =
    scheme === "touch"
      ? "<p>Утримуй кнопки під ареною.</p>"
      : `<p><span>Тяга</span><kbd>${scheme === "wasd" ? "W" : "↑"}</kbd></p><p><span>Гальмування</span><kbd>${scheme === "wasd" ? "S" : "↓"}</kbd></p><p><span>Поворот</span><kbd>${scheme === "wasd" ? "A / D" : "← / →"}</kbd></p><p><span>На старт</span><kbd>R</kbd></p>`;
  canvas.setAttribute(
    "aria-label",
    `Арена FPV. ${scheme === "wasd" ? "W — тяга, S — гальмо, A D — поворот." : scheme === "arrows" ? "Стрілка вгору — тяга, вниз — гальмо, вліво та вправо — поворот." : "Керування кнопками під ареною."}`,
  );
}
$("theme").onclick = () => {
  theme = theme === "dark" ? "light" : "dark";
  preferences.write("glitter-theme", theme);
  applyTheme();
};
$("controls").onchange = (event) => {
  cancelMeasurement();
  scheme = event.target.value;
  preferences.write("glitter-controls", scheme);
  applyScheme();
  canvas.focus({ preventScroll: true });
};
$("trail-toggle").onchange = (event) => {
  showTrail = event.target.checked;
  preferences.write("glitter-show-trail", String(showTrail));
  paint();
};
$("interpolation-toggle").onchange = (event) => {
  showInterpolation = event.target.checked;
  preferences.write("glitter-show-interpolation", String(showInterpolation));
  paint();
};
applyScheme();
applyTheme();
applyOverlays();
surface.setOnResize(() => {
  if (paused) paint();
});
function reset() {
  current = createShip();
  previous = current;
  simulationTime = 0;
  trail = [];
  input.clear();
  touch.clear();
  paint();
}
function cancelMeasurement() {
  if (measuring) {
    measuring = false;
    $("measure").disabled = false;
    $("status").textContent = "Вимірювання скасовано: умови польоту змінилися.";
  }
}
function startLoop() {
  loop?.stop();
  loop = createLoop({
    mode: mode === "block" ? "fixed" : mode,
    simulate(dt) {
      if (input.justPressed("KeyR")) reset();
      previous = current;
      const keys = input.snapshot();
      keys.thrust ||= touch.has("thrust");
      keys.brake ||= touch.has("brake");
      keys.turn += Number(touch.has("right")) - Number(touch.has("left"));
      current = wrapShip(integrate(current, keys, dt));
      simulationTime += dt;
      trail = appendTrail(trail, current, simulationTime);
      input.endStep();
    },
    render(alpha, stats) {
      frameCount++;
      if (mode === "block" && frameCount % 60 === 0) {
        const end = performance.now() + 100;
        while (performance.now() < end) {
          /* Intentional lab experiment. */
        }
      }
      surface.prepare();
      draw(
        surface.ctx,
        interpolate(previous, current, alpha),
        stats,
        performance.now() / 1000,
        theme,
        overlay(),
      );
      $("speed").textContent = Math.hypot(current.vx, current.vy).toFixed(0);
      $("steps").textContent = stats.stepsPerSecond.toFixed(0);
      $("fps").textContent = stats.framesPerSecond.toFixed(0);
      $("ms").textContent = stats.frameMs.toFixed(1);
      if (measuring) {
        samples.push(stats.frameMs);
        if (performance.now() - started >= 10000) {
          measuring = false;
          const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
          result = {
            mode,
            browser: navigator.userAgent,
            dpr: window.devicePixelRatio,
            durationMs: performance.now() - started,
            callbacks: samples.length,
            meanMs: mean,
            minMs: Math.min(...samples),
            maxMs: Math.max(...samples),
            jitterStdDevMs: Math.sqrt(
              samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length,
            ),
            samples,
          };
          $("status").textContent =
            `Готово: середній кадр ${mean.toFixed(2)} ms; максимум ${result.maxMs.toFixed(2)} ms; jitter σ ${result.jitterStdDevMs.toFixed(2)} ms.`;
          $("measure").disabled = false;
          $("download").disabled = false;
        }
      }
    },
  });
  if (!paused) loop.start();
}
$("pause").onclick = () => {
  cancelMeasurement();
  paused = !paused;
  input.clear();
  touch.clear();
  if (paused) loop.stop();
  else loop.start();
  $("pause").textContent = paused ? "Продовжити" : "Пауза";
  $("flight").textContent = paused ? "ПАУЗА" : "ПОЛІТ АКТИВНИЙ";
};
$("reset").onclick = () => {
  reset();
  if (paused) {
    surface.prepare();
    draw(
      surface.ctx,
      current,
      loop.stats,
      performance.now() / 1000,
      theme,
      overlay(),
    );
  }
};
$("mode").onchange = (event) => {
  cancelMeasurement();
  mode = event.target.value;
  frameCount = 0;
  reset();
  startLoop();
};
$("measure").onclick = () => {
  if (paused) {
    $("status").textContent = "Спершу продовж політ.";
    return;
  }
  samples = [];
  started = performance.now();
  measuring = true;
  $("measure").disabled = true;
  $("status").textContent =
    "Вимірюємо 10 секунд. Залиш вкладку активною (крім окремого тесту фону).";
};
$("download").onclick = () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `glitter-fpv-${result.mode}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
for (const button of document.querySelectorAll("[data-control]")) {
  button.onpointerdown = (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touch.add(button.dataset.control);
  };
  button.onpointerup =
    button.onpointercancel =
    button.onlostpointercapture =
      () => touch.delete(button.dataset.control);
}
window.addEventListener("blur", () => touch.clear());
startLoop();
