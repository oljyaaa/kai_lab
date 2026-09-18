export function mountLobby(root, lobby, onJoin) {
  root.innerHTML = `<section class="lobby-card"><span class="eyebrow">✦ LAB 03 · ASYNC LOBBY</span><h1>Glitter FPV Dogfight</h1><p>Обери позивний і кімнату — гра запуститься після завантаження ассетів.</p><label>Позивний <input id="pilot-name" maxlength="18" value="Pilotka"></label><div id="rooms" class="rooms" aria-live="polite">Оновлюю кімнати…</div><div class="actions"><button id="join" disabled>Join та увімкнути звук</button><button id="refresh" class="secondary">Оновити</button></div><p id="lobby-status" class="hint"></p></section>`;
  const rooms = root.querySelector("#rooms");
  const join = root.querySelector("#join");
  const status = root.querySelector("#lobby-status");
  let selected = null;
  lobby.addEventListener("roomsChanged", (event) => {
    rooms.innerHTML = event.detail
      .map(
        (room, index) =>
          `<button class="room ${index === 0 ? "selected" : ""}" data-room="${room.id}"><b>${room.title}</b><span>${room.players}/${room.maxPlayers} пілотів · ${room.arena.width}×${room.arena.height}</span></button>`,
      )
      .join("");
    selected = event.detail[0]?.id || null;
    join.disabled = !selected;
    rooms.querySelectorAll(".room").forEach((button) => {
      button.onclick = () => {
        selected = button.dataset.room;
        rooms.querySelectorAll(".room").forEach((item) => {
          item.classList.toggle("selected", item === button);
        });
      };
    });
  });
  lobby.addEventListener("error", (event) => {
    status.textContent = `Помилка мережі: ${event.detail.message}. Натисни «Оновити».`;
  });
  root.querySelector("#refresh").onclick = () =>
    lobby.refresh().catch(() => {});
  join.onclick = () => {
    try {
      lobby.join(selected, root.querySelector("#pilot-name").value);
      onJoin();
    } catch (error) {
      status.textContent = error.message;
    }
  };
  return () => {
    root.replaceChildren();
  };
}
