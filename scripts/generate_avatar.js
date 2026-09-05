import fs from 'fs';
import zlib from 'zlib';

const size = 640;
const width = size;
const height = size;

// RGBA buffer: (width * 4 + 1) per scanline
const rawData = Buffer.alloc((width * 4 + 1) * height);

function setPixel(x, y, r, g, b, a = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const rowOffset = y * (width * 4 + 1);
  const pxOffset = rowOffset + 1 + x * 4;

  if (a === 255) {
    rawData[pxOffset] = r;
    rawData[pxOffset + 1] = g;
    rawData[pxOffset + 2] = b;
    rawData[pxOffset + 3] = 255;
  } else {
    const alpha = a / 255;
    const inv = 1 - alpha;
    rawData[pxOffset] = Math.round(r * alpha + rawData[pxOffset] * inv);
    rawData[pxOffset + 1] = Math.round(g * alpha + rawData[pxOffset + 1] * inv);
    rawData[pxOffset + 2] = Math.round(b * alpha + rawData[pxOffset + 2] * inv);
    rawData[pxOffset + 3] = 255;
  }
}

// Background: deep obsidian gradient with central metallic radial glow
for (let y = 0; y < height; y++) {
  const rowOffset = y * (width * 4 + 1);
  rawData[rowOffset] = 0; // Filter none
  const ny = y / height;

  for (let x = 0; x < width; x++) {
    const nx = x / width;

    // Dark graphite base
    let r = 8 + (1 - ny) * 10;
    let g = 10 + (1 - ny) * 12;
    let b = 14 + (1 - ny) * 18;

    // Distance from center
    const dx = nx - 0.5;
    const dy = ny - 0.5;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Telegram avatar circular guide glow
    if (dist < 0.48) {
      const glow = (1 - dist / 0.48) * 55;
      r += glow * 0.85;
      g += glow * 0.95;
      b += glow * 1.15;
    }

    // Grid lines subtle
    if (x % 40 === 0 || y % 40 === 0) {
      r += 4; g += 5; b += 7;
    }

    setPixel(x, y, Math.min(255, Math.round(r)), Math.min(255, Math.round(g)), Math.min(255, Math.round(b)), 255);
  }
}

// Draw thick line
function drawThickLine(x0, y0, x1, y1, r, g, b, thickness = 2) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
  const halfT = Math.floor(thickness / 2);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;

    for (let tx = -halfT; tx <= halfT; tx++) {
      for (let ty = -halfT; ty <= halfT; ty++) {
        setPixel(cx + tx, cy + ty, r, g, b, 255);
      }
    }
  }
}

// Draw circular metallic ring at R = 270 (avatar safe area)
const centerX = 320;
const centerY = 320;
const ringRadius = 260;
for (let deg = 0; deg < 360; deg += 0.5) {
  const rad = (deg * Math.PI) / 180;
  const rx = centerX + Math.cos(rad) * ringRadius;
  const ry = centerY + Math.sin(rad) * ringRadius;
  const brightness = 80 + Math.sin(rad * 2) * 50;
  setPixel(rx, ry, Math.round(brightness * 0.9), Math.round(brightness * 1.0), Math.round(brightness * 1.15));
}

// Draw stylized architectural "U" monogram / emblem (USHIMA)
// Hexagon / Diamond cyber-frame
const polyPoints = [
  [320, 130],
  [470, 215],
  [470, 425],
  [320, 510],
  [170, 425],
  [170, 215]
];

for (let i = 0; i < polyPoints.length; i++) {
  const p1 = polyPoints[i];
  const p2 = polyPoints[(i + 1) % polyPoints.length];
  drawThickLine(p1[0], p1[1], p2[0], p2[1], 210, 225, 245, 3);
}

// Inner emblem: Architectural geometric "U"
// Outer U shape
drawThickLine(230, 190, 230, 360, 240, 245, 255, 5); // left outer
drawThickLine(410, 190, 410, 360, 240, 245, 255, 5); // right outer
drawThickLine(230, 360, 275, 430, 240, 245, 255, 5); // left bottom chamfer
drawThickLine(410, 360, 365, 430, 240, 245, 255, 5); // right bottom chamfer
drawThickLine(275, 430, 365, 430, 240, 245, 255, 5); // bottom bar

// Inner U shape
drawThickLine(280, 190, 280, 335, 210, 225, 245, 4); // left inner
drawThickLine(360, 190, 360, 335, 210, 225, 245, 4); // right inner
drawThickLine(280, 335, 305, 380, 210, 225, 245, 4); // left inner chamfer
drawThickLine(360, 335, 335, 380, 210, 225, 245, 4); // right inner chamfer
drawThickLine(305, 380, 335, 380, 210, 225, 245, 4); // inner bottom

// Tops of U pillars
drawThickLine(230, 190, 280, 190, 255, 255, 255, 4);
drawThickLine(360, 190, 410, 190, 255, 255, 255, 4);

// Horizontal tech datum bar across
drawThickLine(200, 260, 440, 260, 56, 189, 248, 2);

// Structural highlights
drawThickLine(255, 205, 255, 350, 255, 255, 255, 2);
drawThickLine(385, 205, 385, 350, 180, 195, 215, 2);

// Corner crosshairs outside avatar
const drawCross = (cx, cy) => {
  drawThickLine(cx - 8, cy, cx + 8, cy, 140, 160, 180, 1);
  drawThickLine(cx, cy - 8, cx, cy + 8, 140, 160, 180, 1);
};
drawCross(40, 40);
drawCross(600, 40);
drawCross(40, 600);
drawCross(600, 600);

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);
ihdrData.writeUInt32BE(height, 4);
ihdrData[8] = 8; // Bit depth
ihdrData[9] = 6; // RGBA
ihdrData[10] = 0; // Deflate
ihdrData[11] = 0; // Filter none
ihdrData[12] = 0; // Non-interlaced
const ihdr = makeChunk('IHDR', ihdrData);

const compressed = zlib.deflateSync(rawData, { level: 9 });
const idat = makeChunk('IDAT', compressed);
const iend = makeChunk('IEND', Buffer.alloc(0));

const png = Buffer.concat([signature, ihdr, idat, iend]);
fs.writeFileSync('public/telegram-avatar-640x640.png', png);
console.log('Successfully generated public/telegram-avatar-640x640.png (' + png.length + ' bytes)');
