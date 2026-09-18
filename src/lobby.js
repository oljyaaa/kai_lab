import { fetchJson } from "./assets/loader.js";

export class Lobby extends EventTarget {
  constructor({
    url = "api/rooms.json",
    intervalMs = 5000,
    timeoutMs = 2800,
  } = {}) {
    super();
    this.url = url;
    this.intervalMs = intervalMs;
    this.timeoutMs = timeoutMs;
    this.visible = false;
    this.timer = null;
    this.controller = null;
    this.rooms = [];
  }
  async refresh() {
    this.controller?.abort();
    this.controller = new AbortController();
    const signal = AbortSignal.any([
      this.controller.signal,
      AbortSignal.timeout(this.timeoutMs),
    ]);
    try {
      this.rooms = await fetchJson(this.url, { signal });
      this.dispatchEvent(
        new CustomEvent("roomsChanged", { detail: this.rooms }),
      );
      return this.rooms;
    } catch (error) {
      if (error.name !== "AbortError" && error.name !== "TimeoutError")
        this.dispatchEvent(new CustomEvent("error", { detail: error }));
      throw error;
    }
  }
  async show() {
    this.visible = true;
    try {
      await this.refresh();
    } catch {
      /* DOM displays a retry action. */
    }
    this.timer = setInterval(
      () => this.refresh().catch(() => {}),
      this.intervalMs,
    );
  }
  hide() {
    this.visible = false;
    clearInterval(this.timer);
    this.timer = null;
    this.controller?.abort();
  }
  join(roomId, name) {
    const room = this.rooms.find((item) => item.id === roomId);
    if (!room) throw new Error("Кімнату не знайдено. Оновіть список.");
    this.dispatchEvent(
      new CustomEvent("joined", {
        detail: { room, name: name.trim() || "Pilotka" },
      }),
    );
  }
}
