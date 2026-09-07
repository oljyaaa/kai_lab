export const ARENA = Object.freeze({ width: 1000, height: 660 });
export const wrap = (n, size) => ((n % size) + size) % size;
export function wrapShip(ship) {
  return {
    ...ship,
    x: wrap(ship.x, ARENA.width),
    y: wrap(ship.y, ARENA.height),
  };
}
export function interpolate(previous, current, alpha) {
  const delta = (a, b, size) => wrap(b - a + size / 2, size) - size / 2;
  return {
    ...current,
    x: wrap(
      previous.x + delta(previous.x, current.x, ARENA.width) * alpha,
      ARENA.width,
    ),
    y: wrap(
      previous.y + delta(previous.y, current.y, ARENA.height) * alpha,
      ARENA.height,
    ),
    angle:
      previous.angle +
      delta(previous.angle, current.angle, Math.PI * 2) * alpha,
  };
}
