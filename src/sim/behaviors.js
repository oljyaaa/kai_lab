import { Vector2 } from "./vector.js";

// Behaviors are data attached to any Entity, not another inheritance branch.
export function attachHoming(entity, { targetId, turnRate = 3.5 } = {}) {
  entity.components.homing = { targetId, turnRate };
  return entity;
}

export function updateHoming(entity, world, dt) {
  const homing = entity.components.homing;
  if (!homing) return;
  const target = world.get(homing.targetId);
  if (!target?.alive) return;
  const desired = target.pos.sub(entity.pos).normalize();
  const speed = Math.max(entity.vel.length(), 80);
  const current = entity.vel.normalize();
  const steering = desired.sub(current).scale(homing.turnRate * dt);
  entity.vel = current.add(steering).normalize().scale(speed);
  entity.angle = Math.atan2(entity.vel.y, entity.vel.x);
}

export function applyPickup(pickup, ship) {
  const data = pickup.components.pickup;
  if (!data) return false;
  if (data.type === "shield") ship.heal(data.value);
  if (data.type === "score") ship.score += data.value;
  pickup.alive = false;
  return true;
}

export function safeSpawnPoint(arena, salt = 0) {
  return new Vector2(
    120 + ((salt * 173) % Math.max(1, arena.width - 240)),
    120 + ((salt * 97) % Math.max(1, arena.height - 240)),
  );
}
