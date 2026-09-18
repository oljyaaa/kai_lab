export const gameEvents = new EventTarget();

export function emit(type, detail = {}) {
  gameEvents.dispatchEvent(new CustomEvent(type, { detail }));
}
