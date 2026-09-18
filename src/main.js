import "./style.css";
import { fetchJson, loadAll, loadJson } from "./assets/loader.js";
import { createAudioContext, Soundboard } from "./audio.js";
import { createInput } from "./input.js";
import { Lobby } from "./lobby.js";
import { mountLobby } from "./lobby-view.js";
import { createLoop } from "./loop.js";
import { drawBattle, drawLoading } from "./render/battle.js";
import { createCanvas } from "./render/canvas.js";
import { attachHoming, safeSpawnPoint } from "./sim/behaviors.js";
import { Asteroid, Pickup, Ship } from "./sim/entities.js";
import { gameEvents } from "./sim/events.js";
import { Vector2 } from "./sim/vector.js";
import { World } from "./sim/world.js";

const app = document.querySelector("#app");
let activeGame;
const failureUrl = (productionPath, developmentPath) =>
  import.meta.env.DEV ? developmentPath : productionPath;

function cancellableDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
function renderLobby() {
  activeGame?.stop();
  app.innerHTML = `<header><div><h1>✿ Glitter FPV</h1><small>ASYNC DOGFIGHT · LAB 03</small></div><span class="pill">♡ Спершу — лобі, потім — політ</span></header><main id="lobby-root"></main>`;
  const lobby = new Lobby();
  const cleanup = mountLobby(
    document.querySelector("#lobby-root"),
    lobby,
    () => {},
  );
  lobby.addEventListener("joined", async (event) => {
    lobby.hide();
    cleanup();
    await bootGame(event.detail);
  });
  lobby.show();
}
function gameMarkup(player, room) {
  app.innerHTML = `<header><div><h1>✿ Glitter FPV Dogfight</h1><small>${player.toUpperCase()} · ${room.title.toUpperCase()}</small></div><div class="header-actions"><button id="theme" class="secondary">☾ Ніч</button><button id="leave" class="secondary">← Лобі</button></div></header><main><div class="intro"><div><h2>Захисти блискучу арену ✧</h2><p>W — тяга, A/D — поворот, S — гальмо, Space — постріл.</p></div><span class="pill">Lab 02: Entity World · Lab 03: assets + sound</span></div><div class="layout"><section class="stage"><div class="stage-top"><span>● ${room.title.toUpperCase()}</span><span id="flight">ПОЛІТ АКТИВНИЙ</span></div><canvas id="game" aria-label="Арена FPV. W тяга, S гальмо, A D поворот, Space постріл."></canvas><div class="touch"><button data-control="left">↶</button><button data-control="thrust">↑ Тяга</button><button data-control="fire">✦ Вогонь</button><button data-control="right">↷</button><button data-control="brake">↓</button></div></section><aside><section class="card"><h3>♡ Стан дрона</h3><div class="metrics"><div><b id="hp">100</b><span>HP</span></div><div><b id="score">0</b><span>score</span></div><div><b id="entities">0</b><span>сутностей Map</span></div><div><b id="fps">0</b><span>frames/s</span></div></div></section><section class="card controls"><h3>Керування</h3><label for="controls">Схема</label><select id="controls"><option value="wasd">WASD + Space</option><option value="arrows">Стрілки + Space</option></select><p><span>Постріл</span><kbd>Space</kbd></p><p><span>Респаун</span><kbd>R</kbd></p><div class="actions"><button id="pause">Пауза</button><button id="reset" class="secondary">Нова арена</button></div></section><section class="card"><h3>Композиція</h3><p class="hint">♡ pickup: shield +30 HP<br>✦ один астероїд має компонент <code>homing</code>.</p><label class="toggle"><input id="debug" type="checkbox"> Показати previous/current</label></section></aside></div><section class="card lab"><b>Галерея збоїв Lab 03</b><button data-failure="404" class="secondary">404 спрайт</button><button data-failure="timeout" class="secondary">Timeout</button><button data-failure="abort" class="secondary">Abort</button><button data-failure="json" class="secondary">Битий JSON</button><span id="status" role="status">Ассети завантажені через Promise.all.</span></section><footer>Vanilla JS · Canvas · Fixed 60 Hz · EventTarget bus · Lab 03</footer></main>`;
}
async function bootGame({ room, name }) {
  app.innerHTML = `<main class="loading"><canvas id="loading-canvas" width="1000" height="480"></canvas><button id="retry" class="secondary" hidden>Повторити</button><p id="load-error" role="alert"></p></main>`;
  const loading = document.querySelector("#loading-canvas").getContext("2d");
  const error = document.querySelector("#load-error");
  const retry = document.querySelector("#retry");
  const audioContext = createAudioContext();
  await audioContext.resume();
  try {
    drawLoading(loading, 0, "Читаю manifest.json…");
    const manifest = await loadJson("assets/manifest.json");
    const assets = await loadAll(manifest, {
      context: audioContext,
      onProgress: ({ completed, total, id }) =>
        drawLoading(
          loading,
          total ? completed / total : 0,
          id ? `Готово: ${id} (${completed}/${total})` : "Готую завантаження…",
        ),
    });
    gameMarkup(name, room);
    activeGame = startGame({ room, name, assets, audioContext });
  } catch (cause) {
    error.textContent = `Завантаження не завершилось: ${cause.message}. Гра не впала — можна повторити.`;
    retry.hidden = false;
    retry.onclick = () => bootGame({ room, name });
  }
}
function startGame({ room, name, assets, audioContext }) {
  const input = createInput(window);
  const surface = createCanvas(document.querySelector("#game"));
  const arena = room.arena;
  const world = new World(arena);
  const ship = world.spawn(
    new Ship({
      name,
      pos: new Vector2(arena.width / 2, arena.height / 2),
      angle: -Math.PI / 2,
    }),
  );
  new Soundboard(audioContext, assets);
  let paused = false;
  let theme = "light";
  let debug = false;
  const touch = new Set();
  const spawnArena = () => {
    for (let i = 0; i < 6; i += 1)
      world.spawn(
        new Asteroid({
          pos: safeSpawnPoint(arena, i + 5),
          vel: new Vector2(((i % 3) - 1) * 45, (i % 2 ? 1 : -1) * 38),
          radius: 28 + i * 3,
          spin: 0.4 + i / 10,
        }),
      );
    const homing = world.spawn(
      new Asteroid({
        pos: new Vector2(130, 120),
        vel: new Vector2(75, 18),
        radius: 34,
        spin: 1,
      }),
    );
    attachHoming(homing, { targetId: ship.id, turnRate: 0.42 });
    world.spawn(
      new Pickup({
        pos: new Vector2(arena.width * 0.75, arena.height * 0.56),
        type: "shield",
        value: 30,
      }),
    );
    world.spawn(
      new Pickup({
        pos: new Vector2(arena.width * 0.24, arena.height * 0.7),
        type: "score",
        value: 50,
      }),
    );
  };
  const resetArena = () => {
    for (const entity of world)
      if (entity.id !== ship.id) world.despawn(entity.id);
    ship.respawn(new Vector2(arena.width / 2, arena.height / 2));
    ship.score = 0;
    spawnArena();
  };
  const hud = () => {
    document.querySelector("#hp").textContent = ship.respawning ? "…" : ship.hp;
    document.querySelector("#score").textContent = ship.score;
    document.querySelector("#entities").textContent = world.size;
  };
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
      hud();
    },
    render(_alpha, stats) {
      surface.prepare();
      drawBattle(surface.ctx, world, ship, assets, stats, {
        dark: theme === "dark",
        debug,
      });
      document.querySelector("#fps").textContent =
        stats.framesPerSecond.toFixed(0);
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
  document.querySelector("#debug").onchange = (event) => {
    debug = event.target.checked;
  };
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
  document.querySelector("#leave").onclick = () => {
    loop.stop();
    input.destroy();
    renderLobby();
  };
  for (const button of document.querySelectorAll("[data-control]")) {
    button.onpointerdown = (event) => {
      event.preventDefault();
      if (button.dataset.control === "fire") {
        ship.fire(world);
        return;
      }
      touch.add(button.dataset.control);
    };
    button.onpointerup =
      button.onpointercancel =
      button.onpointerleave =
        () => touch.delete(button.dataset.control);
  }
  const onRespawn = () => {
    document.querySelector("#status").textContent =
      "Дрон відновлено через 2 секунди.";
  };
  const onFired = () => {
    document.querySelector("#status").textContent =
      "✦ Постріл: куля створена з носа дрона.";
  };
  gameEvents.addEventListener("respawn", onRespawn);
  gameEvents.addEventListener("fired", onFired);
  document.querySelectorAll("[data-failure]").forEach((button) => {
    button.onclick = () => runFailure(button.dataset.failure);
  });
  async function runFailure(kind) {
    const status = document.querySelector("#status");
    const controller = new AbortController();
    try {
      if (kind === "404")
        await fetchJson(
          failureUrl(
            "failures/missing-sprite.png",
            "/__lab-dev-failure/404.png",
          ),
          {
            signal: controller.signal,
          },
        );
      if (kind === "timeout") {
        const signal = AbortSignal.timeout(80);
        await Promise.all([
          fetchJson("failures/slow.json", { signal }),
          cancellableDelay(500, signal),
        ]);
      }
      if (kind === "abort") {
        const promise = fetch("assets/sprites/glitter-fpv-sheet.png", {
          signal: controller.signal,
        });
        controller.abort();
        await promise;
      }
      if (kind === "json")
        await fetchJson("failures/bad.json", {
          signal: controller.signal,
        });
      status.textContent = "Неочікувано: сценарій не зламався.";
    } catch (cause) {
      status.textContent = `✓ ${kind}: ${cause.name} оброблено, гра продовжується.`;
    }
  }
  loop.start();
  return {
    stop: () => {
      loop.stop();
      input.destroy();
      gameEvents.removeEventListener("respawn", onRespawn);
      gameEvents.removeEventListener("fired", onFired);
    },
  };
}
renderLobby();
