import assert from "node:assert/strict";
import test from "node:test";
import { appendTrail, TRAIL_SECONDS } from "../src/sim/trail.js";

test("trail retains only the requested recent simulation window", () => {
  const original = [
    { time: 0, x: 1, y: 1 },
    { time: 5, x: 2, y: 2 },
    { time: 10, x: 3, y: 3 },
  ];
  const result = appendTrail(original, { x: 4, y: 4 }, 12, TRAIL_SECONDS);
  assert.deepEqual(result, [
    { time: 5, x: 2, y: 2 },
    { time: 10, x: 3, y: 3 },
    { time: 12, x: 4, y: 4 },
  ]);
  assert.equal(original.length, 3);
});
