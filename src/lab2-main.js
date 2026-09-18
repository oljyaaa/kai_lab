import "./style.css";
import { createInput } from "./input.js";
import { createLoop } from "./loop.js";
import { createCanvas } from "./render/canvas.js";
import { drawLab2 } from "./render/lab2.js";
import { attachHoming, safeSpawnPoint } from "./sim/behaviors.js";
import { Asteroid, Pickup, Ship } from "./sim/entities.js";
import { gameEvents } from "./sim/events.js";
import { Vector2 } from "./sim/vector.js";
import { World } from "./sim/world.js";

document.querySelector("#app").innerHTML =
  `<header><div><h1>✿ Glitter FPV Dogfight</h1><small>LAB 02 · ОБ’ЄКТИ, ПРОТОТИПИ, THIS</small></div><button id="theme" class="secondary">☾ Ніч</button></header><main><div class="intro"><div><h2>Блискуча бойова арена ✧</h2><p>W — тяга, A/D — поворот, S — гальмо, Space — постріл.</p></div><span class="pill">Map World · Entity · composition</span></div><div class="layout"><section class="stage"><div class="stage-top"><span>● GLITTER GARDEN</span><span id="flight">ПОЛІТ АКТИВНИЙ</span></div><canvas id="game" aria-label="Арена FPV. W тяга, S гальмо, A D поворот, Space постріл."></canvas><div class="touch"><button data-control="left">↶</button><button data-control="thrust">↑ Тяга</button><button data-control="fire">✦ Вогонь</button><button data-control="right">↷</button><button data-control="brake">↓</button></div></section><aside><section class="card"><h3>♡ Стан дрона</h3><div class="metrics"><div><b id="hp">100</b><span>HP</span></div><div><b id="score">0</b><span>score</span></div><div><b id="entities">0</b><span>сутностей у Map</span></div><div><b id="fps">0</b><span>frames/s</span></div></div></section><section class="card controls"><h3>Пульт керування</h3><label for="controls">Схема</label><select id="controls"><option value="wasd">WASD + Space</option><option value="arrows">Стрілки + Space</option></select><p><span>Постріл</span><kbd>Space</kbd></p><p><span>Респаун</span><kbd>R</kbd></p><div class="actions"><button id="pause">Пауза</button><button id="reset" class="secondary">Нова арена</button></div></section><section class="card"><h3>Композиція</h3><p class="hint">♥ pickup: shield або score<br>✦ астероїд із компонентом <code>homing</code>.</p></section></aside></div><section class="card lab"><b>Події симуляції</b><span id="status" role="status">Світ готовий: стріляй у астероїди.</span></section><footer>Lab 02 · Canvas · Fixed 60 Hz · World на Map</footer></main>`;

const arena = { width: 1000, height: 660 };
const world = new World(arena);
const ship = world.spawn(
  new Ship({ pos: new Vector2(500, 330), angle: -Math.PI / 2 }),
);
const input = createInput(window);
const surface = createCanvas(document.querySelector("#game"));
let paused = false;
let theme = "light";
const touch = new Set();

function spawnArena() {
  for (let index = 0; index < 6; index += 1) {
    world.spawn(
      new Asteroid({
        pos: safeSpawnPoint(arena, index + 5),
        vel: new Vector2(((index % 3) - 1) * 45, (index % 2 ? 1 : -1) * 38),
        radius: 28 + index * 3,
        spin: 0.4 + index / 10,
      }),
    );
  }
  const homing = world.spawn(
    new Asteroid({
      pos: new Vector2(120, 115),
      vel: new Vector2(75, 18),
      radius: 34,
    }),
  );
  attachHoming(homing, { targetId: ship.id, turnRate: 0.42 });
  world.spawn(
    new Pickup({ pos: new Vector2(760, 370), type: "shield", value: 30 }),
  );
  world.spawn(
    new Pickup({ pos: new Vector2(250, 460), type: "score", value: 50 }),
  );
}

function resetArena() {
  for (const entity of world)
    if (entity.id !== ship.id) world.despawn(entity.id);
  ship.respawn(new Vector2(500, 330));
  ship.score = 0;
  spawnArena();
}

function updateHud(stats) {
  document.querySelector("#hp").textContent = ship.respawning ? "…" : ship.hp;
  document.querySelector("#score").textContent = ship.score;
  document.querySelector("#entities").textContent = world.size;
  document.querySelector("#fps").textContent = stats.framesPerSecond.toFixed(0);
}

spawnArena();
const loop = createLoop({
  simulate(dt) {
    if (input.justPressed("KeyR")) resetArena();
    const controls = input.snapshot();
    controls.thrust ||= touch.has("thrust");
    controls.brake ||= touch.has("brake");
    controls.turn += Number(touch.has("right")) - Number(touch.has("left"));
    world.step(dt, controls);
    if (input.justPressed("Space")) ship.fire(world);
    input.endStep();
  },
  render(_alpha, stats) {
    surface.prepare();
    drawLab2(surface.ctx, world, stats, theme);
    updateHud(stats);
  },
});

document.querySelector("#theme").onclick = () => {
  theme = theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.querySelector("#theme").textContent =
    theme === "dark" ? "☀ День" : "☾ Ніч";
};
document.querySelector("#controls").onchange = (event) =>
  input.setScheme(event.target.value);
document.querySelector("#pause").onclick = () => {
  paused = !paused;
  paused ? loop.stop() : loop.start();
  document.querySelector("#pause").textContent = paused
    ? "Продовжити"
    : "Пауза";
  document.querySelector("#flight").textContent = paused
    ? "ПАУЗА"
    : "ПОЛІТ АКТИВНИЙ";
};
document.querySelector("#reset").onclick = resetArena;
for (const button of document.querySelectorAll("[data-control]")) {
  button.onpointerdown = (event) => {
    event.preventDefault();
    if (button.dataset.control === "fire") return ship.fire(world);
    touch.add(button.dataset.control);
  };
  button.onpointerup =
    button.onpointercancel =
    button.onpointerleave =
      () => touch.delete(button.dataset.control);
}
gameEvents.addEventListener("fired", () => {
  document.querySelector("#status").textContent =
    "✦ Куля створена з носа дрона.";
});
gameEvents.addEventListener("hit", () => {
  document.querySelector("#status").textContent =
    "✦ Влучання: damage застосовано окремою collision-системою.";
});
gameEvents.addEventListener("exploded", () => {
  document.querySelector("#status").textContent =
    "✦ Вибух: частинки створені, корабель відродиться через 2 секунди.";
});
loop.start();
