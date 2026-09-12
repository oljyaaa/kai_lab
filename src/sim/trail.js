export const TRAIL_SECONDS = 10;

export function appendTrail(trail, ship, time, maxAge = TRAIL_SECONDS) {
  const cutoff = time - maxAge;
  const firstKept = trail.findIndex((point) => point.time >= cutoff);
  const recent = firstKept === -1 ? [] : trail.slice(firstKept);
  return [...recent, { time, x: ship.x, y: ship.y }];
}
