export function createInput(target) {
  const down = new Set();
  const pressed = new Set();
  const allowed = new Set([
    "KeyW",
    "KeyA",
    "KeyD",
    "ArrowUp",
    "ArrowLeft",
    "ArrowRight",
    "KeyR",
    "Space",
  ]);
  function keydown(event) {
    if (
      !allowed.has(event.code) ||
      ["INPUT", "SELECT", "BUTTON", "TEXTAREA"].includes(event.target?.tagName)
    )
      return;
    event.preventDefault();
    if (!down.has(event.code)) pressed.add(event.code);
    down.add(event.code);
  }
  function keyup(event) {
    down.delete(event.code);
  }
  function clear() {
    down.clear();
    pressed.clear();
  }
  target.addEventListener("keydown", keydown);
  target.addEventListener("keyup", keyup);
  target.addEventListener("blur", clear);
  return {
    isDown: (code) => down.has(code),
    justPressed: (code) => pressed.has(code),
    endStep: () => pressed.clear(),
    clear,
    snapshot: () => ({
      thrust: down.has("KeyW") || down.has("ArrowUp"),
      turn:
        Number(down.has("KeyD") || down.has("ArrowRight")) -
        Number(down.has("KeyA") || down.has("ArrowLeft")),
    }),
    destroy() {
      target.removeEventListener("keydown", keydown);
      target.removeEventListener("keyup", keyup);
      target.removeEventListener("blur", clear);
    },
  };
}
