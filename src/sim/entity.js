import { Vector2 } from "./vector.js";

export class Entity {
  static #nextId = 1;
  #id = Entity.#nextId++;

  constructor({
    pos = new Vector2(),
    vel = new Vector2(),
    angle = 0,
    radius = 12,
    kind = "entity",
  } = {}) {
    this.pos = pos;
    this.previousPos = pos.clone();
    this.vel = vel;
    this.angle = angle;
    this.radius = radius;
    this.kind = kind;
    this.alive = true;
    this.components = {};
  }

  get id() {
    return this.#id;
  }
  update(dt) {
    this.previousPos = this.pos.clone();
    this.pos = this.pos.add(this.vel.scale(dt));
  }
}
