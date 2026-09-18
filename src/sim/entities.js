import { Entity } from "./entity.js";
import { emit } from "./events.js";
import { Vector2 } from "./vector.js";

const wrap = (value, size) => ((value % size) + size) % size;

export class Ship extends Entity {
  #hp = 100;

  constructor(options = {}) {
    super({ radius: 26, kind: "ship", ...options });
    this.name = options.name || "Pilotka";
    this.score = 0;
    this.respawnAt = 0;
    this.cooldown = 0;
    this.thrusting = false;
  }

  get hp() {
    return this.#hp;
  }
  heal(amount) {
    this.#hp = Math.min(100, this.#hp + amount);
  }
  takeDamage(amount) {
    this.#hp = Math.max(0, this.#hp - amount);
    return this.#hp === 0;
  }
  respawn(pos) {
    this.respawning = false;
    this.alive = true;
    this.#hp = 100;
    this.pos = pos.clone();
    this.previousPos = pos.clone();
    this.vel = new Vector2();
    this.angle = -Math.PI / 2;
  }
  update(dt, input) {
    super.update(0);
    if (!this.alive || this.respawning) return;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.angle += (input?.turn || 0) * 3.7 * dt;
    this.thrusting = Boolean(input?.thrust);
    if (this.thrusting)
      this.vel = this.vel.add(Vector2.fromAngle(this.angle, 460 * dt));
    if (input?.brake) this.vel = this.vel.scale(Math.max(0, 1 - 6 * dt));
    this.vel = this.vel.scale(Math.max(0, 1 - 0.75 * dt));
    this.pos = this.pos.add(this.vel.scale(dt));
  }
  fire(world) {
    if (!this.alive || this.cooldown > 0) return null;
    this.cooldown = 0.18;
    const direction = Vector2.fromAngle(this.angle);
    const bullet = new Bullet({
      ownerId: this.id,
      pos: this.pos.add(direction.scale(this.radius + 14)),
      vel: this.vel.add(direction.scale(680)),
      angle: this.angle,
    });
    world.spawn(bullet);
    emit("fired", { ship: this, bullet });
    return bullet;
  }
}

export class Bullet extends Entity {
  constructor(options = {}) {
    super({ radius: 7, kind: "bullet", ...options });
    this.ttl = options.ttl ?? 1.35;
    this.damage = options.damage ?? 34;
    this.ownerId = options.ownerId;
  }
  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.alive = false;
  }
}

export class Asteroid extends Entity {
  constructor(options = {}) {
    super({ radius: options.radius ?? 38, kind: "asteroid", ...options });
    this.hp = options.hp ?? 70;
    this.spin = options.spin ?? 0.7;
  }
  update(dt) {
    super.update(dt);
    this.angle += this.spin * dt;
  }
}

export class Pickup extends Entity {
  constructor(options = {}) {
    super({ radius: 18, kind: "pickup", ...options, vel: new Vector2() });
    this.components.pickup = {
      type: options.type || "shield",
      value: options.value ?? 30,
    };
  }
}

export class Explosion extends Entity {
  constructor(options = {}) {
    super({ radius: 1, kind: "explosion", ...options, vel: new Vector2() });
    this.ttl = options.ttl ?? 0.65;
    this.particles = Array.from(
      { length: options.count ?? 18 },
      (_, index) => ({
        angle: (Math.PI * 2 * index) / (options.count ?? 18),
        speed: 45 + ((index * 29) % 120),
        size: 3 + (index % 4),
      }),
    );
  }
  update(dt) {
    this.ttl -= dt;
    if (this.ttl <= 0) this.alive = false;
  }
}

export function wrapEntity(entity, arena) {
  entity.pos = new Vector2(
    wrap(entity.pos.x, arena.width),
    wrap(entity.pos.y, arena.height),
  );
}
