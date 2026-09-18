import { applyPickup, updateHoming } from "./behaviors.js";
import { findCollisionPairs } from "./collision.js";
import { Asteroid, Explosion, Ship, wrapEntity } from "./entities.js";
import { emit } from "./events.js";
import { Vector2 } from "./vector.js";

export class World {
  #entities = new Map();
  #pendingRemoval = new Set();

  constructor(arena) {
    this.arena = arena;
    this.time = 0;
  }
  get size() {
    return this.#entities.size;
  }
  get(id) {
    return this.#entities.get(id);
  }
  spawn(entity) {
    this.#entities.set(entity.id, entity);
    return entity;
  }
  despawn(id) {
    const entity = this.get(id);
    if (entity) {
      entity.alive = false;
      this.#pendingRemoval.add(id);
    }
  }
  *[Symbol.iterator]() {
    yield* this.#entities.values();
  }
  *ofKind(kind) {
    for (const entity of this) if (entity.kind === kind) yield entity;
  }
  sweep() {
    for (const entity of this)
      if (!entity.alive) this.#pendingRemoval.add(entity.id);
    for (const id of this.#pendingRemoval) this.#entities.delete(id);
    this.#pendingRemoval.clear();
  }
  step(dt, input = {}) {
    this.time += dt;
    for (const entity of this) {
      entity.update(dt, entity instanceof Ship ? input : undefined);
      if (
        entity instanceof Ship &&
        entity.respawning &&
        this.time >= entity.respawnAt
      ) {
        entity.respawn(
          new Vector2(this.arena.width / 2, this.arena.height / 2),
        );
        emit("respawn", { ship: entity });
      }
      updateHoming(entity, this, dt);
      if (entity.kind !== "explosion") wrapEntity(entity, this.arena);
    }
    this.#resolveCollisions();
    this.sweep();
  }
  #resolveCollisions() {
    for (const [a, b] of findCollisionPairs(this)) this.#handlePair(a, b);
  }
  #handlePair(a, b) {
    const bullet = a.kind === "bullet" ? a : b.kind === "bullet" ? b : null;
    const other = bullet === a ? b : a;
    if (
      bullet &&
      other &&
      bullet.ownerId !== other.id &&
      (other.kind === "ship" || other.kind === "asteroid")
    ) {
      bullet.alive = false;
      let destroyed;
      if (other.kind === "ship") destroyed = other.takeDamage(bullet.damage);
      else {
        other.hp -= bullet.damage;
        destroyed = other.hp <= 0;
      }
      emit("hit", { target: other, bullet });
      if (destroyed) this.#explode(other, bullet.ownerId);
      return;
    }
    const ship = a.kind === "ship" ? a : b.kind === "ship" ? b : null;
    const pickup = a.kind === "pickup" ? a : b.kind === "pickup" ? b : null;
    if (ship && pickup && ship.alive && pickup.components.pickup) {
      applyPickup(pickup, ship);
      emit("pickup", { ship, pickup });
    }
  }
  #explode(entity, ownerId) {
    if (entity instanceof Ship) entity.respawning = true;
    else entity.alive = false;
    this.spawn(new Explosion({ pos: entity.pos.clone() }));
    emit("exploded", { entity });
    const owner = this.get(ownerId);
    if (owner instanceof Ship && entity instanceof Asteroid) owner.score += 100;
    if (entity instanceof Ship) {
      entity.respawnAt = this.time + 2;
    }
  }
}
