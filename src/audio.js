import { gameEvents } from "./sim/events.js";

export class Soundboard {
  constructor(context, buffers) {
    this.context = context;
    this.buffers = buffers;
    gameEvents.addEventListener("fired", () => this.play("fire", 0.18));
    gameEvents.addEventListener("hit", () => this.play("hit", 0.12));
    gameEvents.addEventListener("exploded", () => this.play("explosion", 0.23));
  }
  play(id, gain = 0.2) {
    const buffer = this.buffers[id];
    if (!buffer || this.context.state !== "running") return;
    const source = this.context.createBufferSource();
    const volume = this.context.createGain();
    volume.gain.value = gain;
    source.buffer = buffer;
    source.connect(volume).connect(this.context.destination);
    source.start();
  }
}

export function createAudioContext() {
  const Context = window.AudioContext || window.webkitAudioContext;
  return new Context();
}
