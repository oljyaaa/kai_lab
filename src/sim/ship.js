export const PHYSICS = Object.freeze({
  turn: 3.2,
  acceleration: 220,
  drag: 0.55,
  maxSpeed: 260,
});
export function createShip() {
  return { x: 500, y: 330, vx: 0, vy: 0, angle: -Math.PI / 2, thrust: false };
}
export function integrate(ship, input, dt) {
  const angle = ship.angle + (input.turn || 0) * PHYSICS.turn * dt;
  const acceleration = input.thrust ? PHYSICS.acceleration : 0;
  let vx =
    (ship.vx + Math.cos(angle) * acceleration * dt) *
    Math.exp(-PHYSICS.drag * dt);
  let vy =
    (ship.vy + Math.sin(angle) * acceleration * dt) *
    Math.exp(-PHYSICS.drag * dt);
  const speed = Math.hypot(vx, vy);
  if (speed > PHYSICS.maxSpeed) {
    vx *= PHYSICS.maxSpeed / speed;
    vy *= PHYSICS.maxSpeed / speed;
  }
  return {
    ...ship,
    x: ship.x + vx * dt,
    y: ship.y + vy * dt,
    vx,
    vy,
    angle,
    thrust: Boolean(input.thrust),
  };
}
