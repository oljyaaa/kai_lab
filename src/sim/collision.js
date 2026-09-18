export function circlesOverlap(a, b) {
  const dx = a.pos.x - b.pos.x;
  const dy = a.pos.y - b.pos.y;
  return dx * dx + dy * dy <= (a.radius + b.radius) ** 2;
}

export function findCollisionPairs(world) {
  const entities = [...world].filter(
    (entity) =>
      entity.alive && !entity.respawning && entity.kind !== "explosion",
  );
  const pairs = [];
  for (let first = 0; first < entities.length; first += 1) {
    for (let second = first + 1; second < entities.length; second += 1) {
      if (circlesOverlap(entities[first], entities[second]))
        pairs.push([entities[first], entities[second]]);
    }
  }
  return pairs;
}
