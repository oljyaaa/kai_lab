export function createLoop({
  step = 1 / 60,
  simulate,
  render,
  mode = "fixed",
  request = requestAnimationFrame,
  cancel = cancelAnimationFrame,
}) {
  let running = false,
    id = null,
    last = null,
    accumulator = 0,
    elapsed = 0,
    steps = 0,
    frames = 0;
  const stats = {
    stepsPerSecond: 0,
    framesPerSecond: 0,
    frameMs: 0,
    totalSteps: 0,
    totalFrames: 0,
    droppedSeconds: 0,
  };
  function frame(now) {
    if (!running) return;
    if (last === null) last = now;
    const raw = Math.max(0, (now - last) / 1000);
    last = now;
    const dt = Math.min(raw, 0.25);
    stats.droppedSeconds += raw - dt;
    stats.frameMs = raw * 1000;
    if (mode === "variable") {
      if (dt > 0) {
        simulate(dt);
        steps++;
        stats.totalSteps++;
      }
    } else {
      accumulator += dt;
      while (accumulator + 1e-12 >= step) {
        simulate(step);
        accumulator = Math.max(0, accumulator - step);
        steps++;
        stats.totalSteps++;
      }
    }
    frames++;
    stats.totalFrames++;
    elapsed += raw;
    if (elapsed >= 1) {
      stats.stepsPerSecond = steps / elapsed;
      stats.framesPerSecond = frames / elapsed;
      steps = 0;
      frames = 0;
      elapsed = 0;
    }
    render(mode === "variable" ? 1 : accumulator / step, stats);
    if (running && mode !== "interval") id = request(frame);
  }
  return {
    stats,
    start() {
      if (running) return;
      running = true;
      last = null;
      accumulator = 0;
      elapsed = 0;
      steps = 0;
      frames = 0;
      id =
        mode === "interval"
          ? setInterval(() => frame(performance.now()), 16)
          : request(frame);
    },
    stop() {
      running = false;
      if (mode === "interval") clearInterval(id);
      else if (id !== null) cancel(id);
      id = null;
    },
  };
}
