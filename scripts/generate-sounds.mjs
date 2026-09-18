import { mkdirSync, writeFileSync } from "node:fs";

function wav({ frequency, duration, type = "sine" }) {
  const rate = 22050;
  const frames = Math.floor(rate * duration);
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write("RIFF", 0); bytes.writeUInt32LE(36 + frames * 2, 4); bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36); bytes.writeUInt32LE(frames * 2, 40);
  for (let index = 0; index < frames; index += 1) {
    const time = index / rate;
    const envelope = Math.max(0, 1 - time / duration) ** 2;
    const wave = type === "noise" ? Math.sin(index * 12.9898) : Math.sin(Math.PI * 2 * frequency * time);
    bytes.writeInt16LE(Math.round(wave * envelope * 0.45 * 32767), 44 + index * 2);
  }
  return bytes;
}

mkdirSync("public/assets/sounds", { recursive: true });
writeFileSync("public/assets/sounds/fire.wav", wav({ frequency: 760, duration: 0.11 }));
writeFileSync("public/assets/sounds/hit.wav", wav({ frequency: 220, duration: 0.14 }));
writeFileSync("public/assets/sounds/explosion.wav", wav({ frequency: 80, duration: 0.38, type: "noise" }));
