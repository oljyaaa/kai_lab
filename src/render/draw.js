import { ARENA } from "../sim/arena.js";

function star(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size / 3, y - size / 3);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size / 3, y + size / 3);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size / 3, y + size / 3);
  ctx.lineTo(x - size, y);
  ctx.lineTo(x - size / 3, y - size / 3);
  ctx.closePath();
  ctx.fill();
}
export function drawShip(ctx, ship, time) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.shadowColor = "#c46c9570";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 7;
  ctx.lineWidth = 9;
  ctx.strokeStyle = "#db5791";
  ctx.beginPath();
  ctx.moveTo(-23, -23);
  ctx.lineTo(23, 23);
  ctx.moveTo(-23, 23);
  ctx.lineTo(23, -23);
  ctx.stroke();
  for (const x of [-25, 25])
    for (const y of [-25, 25]) {
      ctx.fillStyle = "#fff9fc";
      ctx.strokeStyle = "#e981b0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * (ship.thrust ? 35 : 12));
      ctx.fillStyle = "#f9afd2";
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(-19, -15, 38, 30, 12);
  ctx.fill();
  ctx.fillStyle = "#5e345a";
  for (const y of [-6, 6]) {
    ctx.beginPath();
    ctx.arc(7, y, 2.5, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = "#ffcc61";
  ctx.beginPath();
  ctx.ellipse(12, 0, 3, 2, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#f44191";
  ctx.beginPath();
  ctx.moveTo(-8, -13);
  ctx.lineTo(-17, -23);
  ctx.lineTo(-19, -9);
  ctx.lineTo(-8, -13);
  ctx.lineTo(1, -23);
  ctx.lineTo(4, -9);
  ctx.closePath();
  ctx.fill();
  if (ship.thrust) {
    ctx.fillStyle = "#f69bcf";
    star(ctx, -60, 0, 9 + Math.sin(time * 20) * 4);
    star(ctx, -80, 8, 4);
  }
  ctx.restore();
}
export function draw(ctx, ship, stats, time, theme = "light") {
  const dark = theme === "dark";
  ctx.fillStyle = dark ? "#291c32" : "#fff3f9";
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  ctx.strokeStyle = dark ? "#44304b" : "#f3dce9";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1000; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 660);
    ctx.stroke();
  }
  for (let y = 0; y <= 660; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1000, y);
    ctx.stroke();
  }
  for (let i = 0; i < 48; i++) {
    ctx.fillStyle = i % 3 ? "#eec0df" : "#e6b95f";
    star(ctx, (i * 173 + 32) % 1000, (i * 97 + 25) % 660, 2 + (i % 5));
  }
  ctx.strokeStyle = "#e6adce";
  ctx.setLineDash([8, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(500, 330, 310, 215, -0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = dark ? "#5d355770" : "#f6dceca0";
  ctx.beginPath();
  ctx.arc(500, 330, 85, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#d18eb6";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("H", 500, 380);
  for (const dx of [-1000, 0, 1000])
    for (const dy of [-660, 0, 660])
      drawShip(ctx, { ...ship, x: ship.x + dx, y: ship.y + dy }, time);
  ctx.textAlign = "left";
  ctx.fillStyle = dark ? "#f9d7ec" : "#69415f";
  ctx.font = "15px monospace";
  ctx.fillText(
    `${stats.stepsPerSecond.toFixed(0)} steps/s   ${stats.framesPerSecond.toFixed(0)} frames/s   ${stats.frameMs.toFixed(1)} ms`,
    24,
    35,
  );
}
