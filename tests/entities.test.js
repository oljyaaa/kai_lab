import assert from "node:assert/strict";
import test from "node:test";
import { Asteroid, Bullet, Ship } from "../src/sim/entities.js";
import { Vector2 } from "../src/sim/vector.js";
import { World } from "../src/sim/world.js";

test("Vector2 calculations are pure and Entity ids stay private but readable", () => {
  const a = new Vector2(2, 3);
  const b = a.add(new Vector2(4, 5));
  assert.deepEqual(a, new Vector2(2, 3));
  assert.deepEqual(b, new Vector2(6, 8));
  const first = new Ship();
  const second = new Ship();
  assert.ok(second.id > first.id);
});

test("World is iterable, indexes entities in Map and sweeps a dead TTL bullet", () => {
  const world = new World({ width: 1000, height: 660 });
  const ship = world.spawn(new Ship());
  const bullet = world.spawn(new Bullet({ ttl: 0.01 }));
  assert.equal([...world.ofKind("ship")][0], ship);
  world.step(1 / 30, {});
  assert.equal(world.get(bullet.id), undefined);
});

test("circle collision damages asteroid and rewards the bullet owner", () => {
  const world = new World({ width: 1000, height: 660 });
  const ship = world.spawn(new Ship({ pos: new Vector2(500, 500) }));
  const asteroid = world.spawn(
    new Asteroid({ pos: new Vector2(200, 200), hp: 20 }),
  );
  world.spawn(
    new Bullet({
      ownerId: ship.id,
      pos: new Vector2(200, 200),
      vel: new Vector2(),
      damage: 30,
    }),
  );
  world.step(1 / 60, {});
  assert.equal(ship.score, 100);
  assert.equal(world.get(asteroid.id), undefined);
});
