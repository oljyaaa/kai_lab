function star(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}

function drone(ctx, ship) {
  ctx.save();
  ctx.translate(ship.pos.x, ship.pos.y);
  ctx.rotate(ship.angle);
  ctx.strokeStyle = "#d95090";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-22, -22);
  ctx.lineTo(22, 22);
  ctx.moveTo(-22, 22);
  ctx.lineTo(22, -22);
  ctx.stroke();
  for (const x of [-25, 25]) {
    for (const y of [-25, 25]) {
      ctx.fillStyle = "#fffafd";
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ef8ebb";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(-19, -14, 38, 28, 12);
  ctx.fill();
  ctx.fillStyle = "#ff5c9f";
  ctx.fillRect(10, -4, 8, 8);
  ctx.restore();
}

export function drawLab2(ctx, world, stats, theme = "light") {
  const dark = theme === "dark";
  const { width, height } = world.arena;
  ctx.fillStyle = dark ? "#231625" : "#fff3f9";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = dark ? "#4d344e" : "#f0cde1";
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
  for (let index = 0; index < 36; index += 1) {
    ctx.fillStyle = index % 3 ? "#edb3d3" : "#f5c65b";
    star(
      ctx,
      (index * 139 + 21) % width,
      (index * 79 + 27) % height,
      2 + (index % 4),
    );
  }
  for (const entity of world) {
    if (!entity.alive || entity.respawning) continue;
    if (entity.kind === "ship") drone(ctx, entity);
    if (entity.kind === "bullet") {
      ctx.fillStyle = "#ffbd4f";
      ctx.beginPath();
      ctx.arc(entity.pos.x, entity.pos.y, entity.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (entity.kind === "asteroid") {
      ctx.save();
      ctx.translate(entity.pos.x, entity.pos.y);
      ctx.rotate(entity.angle);
      ctx.fillStyle = "#b67fb2";
      ctx.beginPath();
      ctx.arc(0, 0, entity.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e9b8dc";
      ctx.beginPath();
      ctx.arc(
        -entity.radius / 3,
        -entity.radius / 5,
        entity.radius / 5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }
    if (entity.kind === "pickup") {
      ctx.fillStyle = "#ff609f";
      ctx.font = "32px sans-serif";
      ctx.fillText("♥", entity.pos.x - 14, entity.pos.y + 11);
    }
    if (entity.kind === "explosion") {
      ctx.fillStyle = "#ffbd4f";
      for (const particle of entity.particles) {
        const progress = 1 - entity.ttl / 0.65;
        ctx.beginPath();
        ctx.arc(
          entity.pos.x + Math.cos(particle.angle) * particle.speed * progress,
          entity.pos.y + Math.sin(particle.angle) * particle.speed * progress,
          particle.size,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
  ctx.fillStyle = dark ? "#ffe1ef" : "#623c59";
  ctx.font = "700 15px ui-monospace, monospace";
  ctx.fillText(
    `${stats.stepsPerSecond.toFixed(0)} steps/s · ${stats.framesPerSecond.toFixed(0)} fps · ${stats.frameMs.toFixed(1)} ms`,
    22,
    30,
  );
}
