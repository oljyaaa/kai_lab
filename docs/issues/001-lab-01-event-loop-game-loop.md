# Lab 01: fixed-timestep game loop and controllable ship

## Goal

Create the first playable vertical slice of the semester project: a browser-based
space-ship arena made with vanilla JavaScript and Vite. The ship must be controlled
from the keyboard, simulated at a deterministic 60 steps per second, and rendered
smoothly on displays with any refresh rate.

## Scope

- Create a Vite vanilla-JS project using ES modules.
- Configure Node 22+ through `.nvmrc` and add ESLint + Prettier (or Biome).
- Implement a `requestAnimationFrame` loop with a clamped fixed-step accumulator.
- Show simulation steps/s, render frames/s, and frame time in a Canvas HUD.
- Implement keyboard input as a `createInput()` closure with `isDown()` and
  `justPressed()`.
- Implement DOM-independent ship physics in `integrate(ship, input, dt)`.
- Render an interpolated ship on a DPR-aware, resizable Canvas arena.
- Implement arena edge wrap-around.
- Run and document the three required performance/behaviour experiments.
- Tag the completed revision as `lab-01`.

## Implementation plan

### 1. Project setup

- [ ] Scaffold the project with Vite's `vanilla` template.
- [ ] Add `"type": "module"` to `package.json`.
- [ ] Add `.nvmrc` with Node 22 or newer.
- [ ] Configure ESLint + Prettier (or Biome) and add `lint`, `format`, and `build`
      scripts.
- [ ] Create the initial project commit.

### 2. Module boundaries

Create the following structure. Simulation modules must never import DOM or Canvas APIs.

```txt
src/
  main.js                 # composition root: wire modules and start the loop
  loop.js                 # createLoop({ step, simulate, render })
  input.js                # createInput(target)
  sim/
    ship.js               # ship data and integrate(ship, input, dt)
    arena.js              # arena size and wrap-around
  render/
    canvas.js             # DPR-aware canvas setup and resize
    draw.js               # ship, background/grid, and HUD drawing
```

- [ ] Export named functions from every module.
- [ ] Keep a ship as plain data: `{ x, y, vx, vy, angle, thrust }`.
- [ ] Keep `main.js` small: it owns composition but not physics or drawing details.

### 3. Fixed-timestep loop (M1)

- [ ] Export `createLoop({ step = 1 / 60, simulate, render })` returning
      `{ start, stop }`.
- [ ] Schedule frames with `requestAnimationFrame`, passing its timestamp to the
      loop.
- [ ] Calculate `frameDelta = min((now - last) / 1000, 0.25)` and accumulate it.
- [ ] While `accumulator >= step`, call `simulate(step)` and subtract `step`.
- [ ] Call `render(accumulator / step)` after simulation; the value is interpolation
      alpha in `[0, 1)`.
- [ ] Track and expose steps/s, frames/s, and last frame duration.
- [ ] Render these metrics in an on-canvas HUD.

Acceptance criteria: `steps/s` remains 60; `frames/s` follows the display refresh
rate; the loop can be stopped without leaving an active rAF request.

### 4. Input and simulation (M2)

- [ ] Create a private `Set` of pressed keys inside `createInput(target)`.
- [ ] Add keyboard listeners for rotate-left, rotate-right, and thrust.
- [ ] Implement `isDown(code)` and edge-triggered `justPressed(code)`.
- [ ] Clear transient key presses after each simulation step and clear held keys on
      window blur.
- [ ] Implement `integrate(ship, input, dt)` as a pure function: rotation, thrust
      in the ship heading, drag, speed clamp, and position update.
- [ ] Implement `wrapShip(ship, arena)` independently of rendering.
- [ ] Tune and record constants such as rotation speed, acceleration, drag, and
      maximum speed.

Acceptance criteria: a player can fly continuously with keyboard controls and the
simulation module has no DOM/Canvas imports.

### 5. Rendering and interpolation (M3)

- [ ] Store `previousShip` and `currentShip` around every fixed simulation step.
- [ ] Interpolate `x`, `y`, velocity, and heading using render alpha.
- [ ] Use shortest-path angle interpolation to avoid rotating almost 360 degrees when
      crossing the `-PI`/`PI` boundary.
- [ ] Resize the backing Canvas resolution to CSS size × `devicePixelRatio`.
- [ ] Reset the Canvas transform with DPR scaling after every resize.
- [ ] Draw the ship through `save()`, `translate()`, `rotate()`, draw, `restore()`.
- [ ] Add a thrust flame and a grid or starfield to make motion visible.

Acceptance criteria: rendering remains sharp on HiDPI screens, canvas resizing works,
and motion appears smooth at 60 Hz and higher refresh rates.

### 6. Required measurements and README (M4)

- [ ] Establish a baseline: browser/version, operating system, screen refresh rate,
      average frames/s, and normal frame-time range.
- [ ] Experiment 1: add a 100 ms busy wait in `render()` every 60th frame. Capture
      HUD evidence and explain why synchronous work blocks input, timers, microtasks,
      and rendering on the main thread.
- [ ] Experiment 2: temporarily replace rAF scheduling with `setInterval(frame, 16)`.
      Measure 10 seconds of frames/s and frame-time jitter, then background the tab
      for 5 seconds and record the effect.
- [ ] Experiment 3: remove the accumulator and call `simulate(dt)` once per frame.
      Under normal and 6× CPU-throttled DevTools runs, hold thrust for five seconds
      and record final coordinates. Restore fixed stepping and show matching results.
- [ ] Include own measured values and screenshots in `README.md`; never use invented
      numbers.

## Definition of done

- [ ] The build and linter finish with no errors.
- [ ] A keyboard-controlled ship flies smoothly on a resizable Canvas arena.
- [ ] HUD reports steps/s, frames/s, and frame time.
- [ ] Simulation is deterministic fixed-step, while rendering is interpolated.
- [ ] DPR is handled and the simulation remains separated from DOM/Canvas code.
- [ ] README has all three experiments, values/screenshots, and event-loop analysis.
- [ ] The public GitHub repository contains this history and tag `lab-01`.

## Demo / defense checklist

- Start the Vite dev server and demonstrate flight, wrap-around, HUD, and resize.
- Show `loop.js`, `input.js`, and `sim/ship.js` to prove module separation.
- Explain why Promise callbacks run before timer callbacks after synchronous code.
- Explain why `requestAnimationFrame` is preferred over `setInterval` for rendering.
- Trace the accumulator, delta clamp, and interpolation alpha on a whiteboard.
- Explain why determinism matters when a Node server becomes authoritative in Lab 5.

## References

- [Lab 01 specification](https://github.com/rmalkevy/Programming-Practice-Projects/blob/main/courses/javascript/lab-01-event-loop-and-game-loop.md)
- [JavaScript course overview](https://github.com/rmalkevy/Programming-Practice-Projects/blob/main/courses/javascript/README.md)
- [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)
