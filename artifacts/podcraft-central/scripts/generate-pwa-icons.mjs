// Generates 192×192 and 512×512 PNG icons for PodCraft Central PWA.
// Uses only Node.js built-ins (zlib + fs) — no external deps.
// Design: violet gradient background (#7c3aed) with a white microphone circle.

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── CRC32 ────────────────────────────────────────────────────────────────────

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// ─── PNG builder ──────────────────────────────────────────────────────────────

function makePng(size, pixelFn) {
  // Build raw (uncompressed) IDAT rows: each row = [filterByte, R, G, B, R, G, B, …]
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = new Uint8Array(1 + size * 3);
    row[0] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelFn(x, y, size);
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    rows.push(row);
  }
  const rawData = Buffer.concat(rows.map(r => Buffer.from(r)));
  const idat = deflateSync(rawData);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Pixel function — PodCraft icon ──────────────────────────────────────────
// Violet background #7c3aed with a white microphone-style pill in the centre

function podcastIcon(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const nx = (x - cx) / (size / 2); // −1..1
  const ny = (y - cy) / (size / 2);

  // Background: deep violet #5b21b6 → bright violet #7c3aed gradient top→bottom
  const t = (y / size);
  const bgR = Math.round(91  + (124 - 91)  * t);
  const bgG = Math.round(33  + (58  - 33)  * t);
  const bgB = Math.round(182 + (237 - 182) * t);

  // White circle (safe area): radius 0.72 of half-size
  const circleR = 0.72;
  const distCircle = Math.sqrt(nx * nx + ny * ny);
  if (distCircle <= circleR) {
    // inside white circle background
    const innerR = 0.68;

    // Microphone body: rounded rect pill, centred, upper 40% of circle
    const micW  = 0.22;
    const micH  = 0.36;
    const micTopY = -0.28;
    const micBotY =  0.08;
    const micRadius = micW;

    // Is point inside mic pill?
    const inMicX = Math.abs(nx) <= micW;
    const inMicY = ny >= micTopY && ny <= micBotY;
    // corners: distance from corner centres
    const tlCx = -micW + micRadius, tlCy = micTopY + micRadius;
    const trCx =  micW - micRadius, trCy = micTopY + micRadius;
    const blCx = -micW + micRadius, blCy = micBotY - micRadius;
    const brCx =  micW - micRadius, brCy = micBotY - micRadius;
    const inTopRect = Math.abs(nx) <= micW - micRadius && ny >= micTopY && ny <= micTopY + micRadius;
    const inBotRect = Math.abs(nx) <= micW - micRadius && ny >= micBotY - micRadius && ny <= micBotY;
    const inMidRect = Math.abs(nx) <= micW && ny >= micTopY + micRadius && ny <= micBotY - micRadius;
    const nearTL = Math.sqrt((nx - tlCx) ** 2 + (ny - tlCy) ** 2) <= micRadius;
    const nearTR = Math.sqrt((nx - trCx) ** 2 + (ny - trCy) ** 2) <= micRadius;
    const nearBL = Math.sqrt((nx - blCx) ** 2 + (ny - blCy) ** 2) <= micRadius;
    const nearBR = Math.sqrt((nx - brCx) ** 2 + (ny - brCy) ** 2) <= micRadius;
    const inMic = inMidRect || inTopRect || inBotRect || nearTL || nearTR || nearBL || nearBR;

    // Stand arc: partial ring below mic body (y 0.08..0.30, x narrow)
    const standDist = Math.sqrt(nx * nx + (ny - 0.05) ** 2);
    const standArcOuter = 0.30;
    const standArcInner = 0.22;
    const inStandArc = standDist >= standArcInner && standDist <= standArcOuter
      && ny >= 0.07 && ny <= 0.32;

    // Stand base: thin horizontal line at y=0.32
    const inBase = Math.abs(ny - 0.32) <= 0.025 && Math.abs(nx) <= 0.20;

    // Stand pole: vertical line from arc to base
    const inPole = Math.abs(nx) <= 0.025 && ny >= 0.20 && ny <= 0.33;

    if (distCircle <= innerR && (inMic || inStandArc || inBase || inPole)) {
      return [bgR, bgG, bgB]; // violet colour for mic shape
    }

    // White fill for circle background
    return [255, 255, 255];
  }

  return [bgR, bgG, bgB];
}

// ─── Generate ────────────────────────────────────────────────────────────────

const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const png = makePng(size, podcastIcon);
  writeFileSync(join(outDir, `icon-${size}.png`), png);
  console.log(`✓ icon-${size}.png  (${png.length} bytes)`);
}

// Apple touch icon — same design, 180x180 (rounded by iOS automatically)
const apple = makePng(180, podcastIcon);
writeFileSync(join(outDir, 'apple-touch-icon.png'), apple);
console.log('✓ apple-touch-icon.png');

console.log(`Icons written to: ${outDir}`);
