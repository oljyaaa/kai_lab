import { ARENA } from "../sim/arena.js";
export function createCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return {
    ctx,
    prepare() {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      )
        resize();
      ctx.setTransform(
        canvas.width / ARENA.width,
        0,
        0,
        canvas.height / ARENA.height,
        0,
        0,
      );
    },
    destroy: () => observer.disconnect(),
  };
}
