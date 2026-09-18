export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    return new Vector2(this.x + other.x, this.y + other.y);
  }
  sub(other) {
    return new Vector2(this.x - other.x, this.y - other.y);
  }
  scale(amount) {
    return new Vector2(this.x * amount, this.y * amount);
  }
  length() {
    return Math.hypot(this.x, this.y);
  }
  normalize() {
    const length = this.length();
    return length ? this.scale(1 / length) : new Vector2();
  }
  rotate(radians) {
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    return new Vector2(
      this.x * cosine - this.y * sine,
      this.x * sine + this.y * cosine,
    );
  }
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
  addInPlace(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }
  scaleInPlace(amount) {
    this.x *= amount;
    this.y *= amount;
    return this;
  }
  static fromAngle(angle, length = 1) {
    return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
  }
}
