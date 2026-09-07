export function createInput(target, initialScheme = "wasd") {
  let scheme = initialScheme;
  const down = new Set();
  const pressed = new Set();
  const allowed = new Set([
    "KeyW",
    "KeyA",
    "KeyD",
    "KeyS",
    "ArrowDown",
    "ArrowUp",
    "ArrowLeft",
    "ArrowRight",
    "KeyR",
    "Space",
  ]);
  function keydown(event) {
    const movement =
      scheme === "wasd"
        ? ["KeyW", "KeyA", "KeyS", "KeyD"]
        : scheme === "arrows"
          ? ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"]
          : [];
    if (
      !allowed.has(event.code) ||
      (!movement.includes(event.code) && event.code !== "KeyR") ||
      ["INPUT", "SELECT", "TEXTAREA"].includes(event.target?.tagName) ||
      event.target?.isContentEditable ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
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
    setScheme(next) {
      scheme = next;
      clear();
    },
    snapshot: () => ({
      thrust:
        scheme === "wasd"
          ? down.has("KeyW")
          : scheme === "arrows" && down.has("ArrowUp"),
      brake:
        scheme === "wasd"
          ? down.has("KeyS")
          : scheme === "arrows" && down.has("ArrowDown"),
      turn:
        scheme === "wasd"
          ? Number(down.has("KeyD")) - Number(down.has("KeyA"))
          : scheme === "arrows"
            ? Number(down.has("ArrowRight")) - Number(down.has("ArrowLeft"))
            : 0,
    }),
    destroy() {
      target.removeEventListener("keydown", keydown);
      target.removeEventListener("keyup", keyup);
      target.removeEventListener("blur", clear);
    },
  };
}
