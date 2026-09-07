import { createShip, integrate } from "../src/sim/ship.js";

for (const hz of [60, 10]) {
  let ship = createShip();
  for (let i = 0; i < 5 * hz; i++)
    ship = integrate(ship, { thrust: true }, 1 / hz);
  console.log(
    JSON.stringify({ kind: "synthetic-variable", hz, x: ship.x, y: ship.y }),
  );
}
