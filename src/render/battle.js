function sparkle(ctx, x, y, size) {
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

function sprite(ctx, image, cell, entity, size, alpha = 1) {
  if (!image) return;
  const cellWidth = image.width / 4;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(entity.pos.x, entity.pos.y);
  ctx.rotate(entity.angle || 0);
  ctx.drawImage(
    image,
    cell * cellWidth,
    0,
    cellWidth,
    image.height,
    -size / 2,
    -size / 2,
    size,
    size,
  );
  ctx.restore();
}

export function drawBattle(
  ctx,
  world,
  ship,
  assets,
  stats,
  { dark = false, debug = false } = {},
) {
  const { width, height } = world.arena;
  ctx.fillStyle = dark ? "#211724" : "#fff3f9";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = dark ? "#4c3552" : "#f0cbe0";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let index = 0; index < 35; index += 1) {
    ctx.fillStyle = index % 3 ? "#f3b8d8" : "#f6c95d";
    sparkle(
      ctx,
      (index * 137 + 33) % width,
      (index * 83 + 16) % height,
      2 + (index % 4),
    );
  }
  for (const entity of world) {
    if (!entity.alive || entity.respawning) continue;
    if (entity.kind === "ship") sprite(ctx, assets.sprites, 0, entity, 115);
    if (entity.kind === "bullet") sprite(ctx, assets.sprites, 1, entity, 35);
    if (entity.kind === "asteroid")
      sprite(ctx, assets.sprites, 2, entity, entity.radius * 2.7);
    if (entity.kind === "pickup") sprite(ctx, assets.sprites, 3, entity, 62);
    if (entity.kind === "explosion") {
      const life = Math.max(0, entity.ttl / 0.65);
      ctx.save();
      ctx.globalAlpha = life;
      ctx.fillStyle = "#ffbf4f";
      for (const particle of entity.particles) {
        const progress = 1 - life;
        ctx.beginPath();
        ctx.arc(
          entity.pos.x + Math.cos(particle.angle) * particle.speed * progress,
          entity.pos.y + Math.sin(particle.angle) * particle.speed * progress,
          particle.size * life,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.restore();
    }
  }
  ctx.fillStyle = dark ? "#ffdbef" : "#623b58";
  ctx.font = "700 15px ui-monospace, monospace";
  ctx.fillText(
    `${stats.stepsPerSecond.toFixed(0)} steps/s · ${stats.framesPerSecond.toFixed(0)} frames/s · ${stats.frameMs.toFixed(1)} ms`,
    22,
    30,
  );
  if (debug) {
    ctx.fillStyle = "#6bc3ee";
    ctx.beginPath();
    ctx.arc(ship.previousPos.x, ship.previousPos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f43f94";
    ctx.beginPath();
    ctx.arc(ship.pos.x, ship.pos.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawLoading(ctx, progress, message) {
  const { canvas } = ctx;
  ctx.fillStyle = "#fff3f9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const width = canvas.width * 0.68;
  const height = 24;
  const x = (canvas.width - width) / 2;
  const y = canvas.height / 2;
  ctx.fillStyle = "#d85a95";
  ctx.font = "700 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✦ Завантаження Glitter FPV", canvas.width / 2, y - 38);
  ctx.fillStyle = "#f6d8e8";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#f05c9d";
  ctx.fillRect(x, y, width * progress, height);
  ctx.fillStyle = "#784763";
  ctx.font = "14px sans-serif";
  ctx.fillText(message, canvas.width / 2, y + 52);
  ctx.textAlign = "left";
}

export function interpolatedPosition(entity, alpha) {
  return entity.previousPos.add(
    entity.pos.sub(entity.previousPos).scale(alpha),
  );
}
