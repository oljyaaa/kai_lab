import assert from "node:assert/strict";
import test from "node:test";
import { createInput } from "../src/input.js";

test("S is handled on focused buttons, but not in editors or browser shortcuts", () => {
  const target = new EventTarget();
  target.tagName = "BUTTON";
  const input = createInput(target);
  function press(extra = {}) {
    const event = new Event("keydown", { cancelable: true });
    for (const [key, value] of Object.entries({ code: "KeyS", ...extra }))
      Object.defineProperty(event, key, { value });
    target.dispatchEvent(event);
    return event;
  }
  assert.equal(press().defaultPrevented, true);
  assert.equal(input.snapshot().brake, true);
  input.clear();
  for (const tag of ["INPUT", "TEXTAREA", "SELECT"]) {
    target.tagName = tag;
    assert.equal(press().defaultPrevented, false);
    assert.equal(input.snapshot().brake, false);
  }
  target.tagName = "BUTTON";
  for (const modifier of ["ctrlKey", "metaKey", "altKey"]) {
    assert.equal(press({ [modifier]: true }).defaultPrevented, false);
    assert.equal(input.snapshot().brake, false);
  }
  target.isContentEditable = true;
  assert.equal(press().defaultPrevented, false);
  assert.equal(input.snapshot().brake, false);
  input.destroy();
});

test("brake reduces speed and overrides thrust without mutation", () => {
  const ship = Object.freeze({ ...createShip(), vx: 100 });
  const normal = integrate(ship, {}, 1 / 60);
  const braking = integrate(ship, { brake: true, thrust: true }, 1 / 60);
  assert.ok(braking.vx < normal.vx);
  assert.equal(braking.thrust, false);
  assert.equal(ship.vx, 100);
});
test("switching schemes clears keys and disables inactive controls", () => {
  const target = new EventTarget();
  const input = createInput(target);
  const press = (code) => {
    const e = new Event("keydown");
    Object.defineProperty(e, "code", { value: code });
    target.dispatchEvent(e);
  };
  press("KeyW");
  assert.equal(input.snapshot().thrust, true);
  input.setScheme("arrows");
  assert.equal(input.snapshot().thrust, false);
  press("KeyW");
  assert.equal(input.snapshot().thrust, false);
  press("ArrowDown");
  assert.equal(input.snapshot().brake, true);
  input.setScheme("touch");
  press("ArrowUp");
  assert.equal(input.snapshot().thrust, false);
  input.destroy();
});

import { createLoop } from "../src/loop.js";
import { interpolate, wrapShip } from "../src/sim/arena.js";
import { createShip, integrate } from "../src/sim/ship.js";

test("physics is pure, repeatable and speed limited", () => {
  const initial = Object.freeze(createShip());
  const input = Object.freeze({ thrust: true, turn: 0 });
  assert.deepEqual(
    integrate(initial, input, 1 / 60),
    integrate(initial, input, 1 / 60),
  );
  let ship = initial;
  for (let i = 0; i < 1000; i++) ship = integrate(ship, input, 1 / 60);
  assert.ok(Math.hypot(ship.vx, ship.vy) <= 260.00001);
  assert.equal(initial.y, 330);
});
test("wrapping and interpolation take the short route", () => {
  assert.equal(wrapShip({ x: -2, y: 663 }).x, 998);
  const mid = interpolate(
    { x: 999, y: 10, angle: Math.PI - 0.1 },
    { x: 1, y: 10, angle: -Math.PI + 0.1 },
    0.5,
  );
  assert.equal(mid.x, 0);
  assert.ok(Math.abs(mid.angle - Math.PI) < 1e-10);
});
test("60/120/144 Hz yield identical physics over five seconds", () => {
  const states = [];
  for (const hz of [60, 120, 144]) {
    let next,
      calls = 0,
      state = createShip();
    const loop = createLoop({
      request: (callback) => {
        next = callback;
        return 1;
      },
      cancel: () => {},
      simulate: (dt) => {
        calls++;
        state = integrate(state, { thrust: true }, dt);
      },
      render: (alpha) => assert.ok(alpha >= 0 && alpha < 1),
    });
    loop.start();
    loop.start();
    for (let i = 0; i <= hz * 5; i++) next((i * 1000) / hz);
    loop.stop();
    next(6000);
    assert.equal(calls, 300);
    states.push(state);
  }
  assert.deepEqual(states[0], states[1]);
  assert.deepEqual(states[1], states[2]);
});
test("large frame delta is clamped and stop/start does not catch up paused time", () => {
  let next,
    calls = 0;
  const loop = createLoop({
    request: (cb) => {
      next = cb;
      return 1;
    },
    cancel: () => {},
    simulate: () => calls++,
    render: () => {},
  });
  loop.start();
  next(0);
  next(10000);
  assert.equal(calls, 15);
  assert.equal(loop.stats.droppedSeconds, 9.75);
  loop.stop();
  loop.start();
  next(90000);
  assert.equal(calls, 15);
  loop.stop();
});
test("input tracks edges, repeat, blur and listener cleanup", () => {
  const target = new EventTarget();
  const input = createInput(target);
  const key = (type) => {
    const event = new Event(type);
    Object.defineProperty(event, "code", { value: "KeyW" });
    target.dispatchEvent(event);
  };
  key("keydown");
  assert.ok(input.isDown("KeyW"));
  assert.ok(input.justPressed("KeyW"));
  input.endStep();
  key("keydown");
  assert.equal(input.justPressed("KeyW"), false);
  target.dispatchEvent(new Event("blur"));
  assert.equal(input.isDown("KeyW"), false);
  input.destroy();
  key("keydown");
  assert.equal(input.isDown("KeyW"), false);
});
