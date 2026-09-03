import fs from 'fs';
import zlib from 'zlib';

const width = 640;
const height = 360;

// RGBA buffer: (width * 4 + 1) per line
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

// Background
for (let y = 0; y < height; y++) {
  const rowOffset = y * (width * 4 + 1);
  rawData[rowOffset] = 0; // Filter: none
  const ny = y / height;

  for (let x = 0; x < width; x++) {
    const nx = x / width;

    // Dark graphite metallic aesthetic
    let r = 10 + Math.sin(nx * Math.PI) * 14 + (1 - ny) * 8;
    let g = 12 + Math.sin(nx * Math.PI) * 16 + (1 - ny) * 10;
    let b = 16 + Math.sin(nx * Math.PI) * 22 + (1 - ny) * 14;

    // Radial silver glow from center
    const dx = nx - 0.5;
    const dy = ny - 0.48;
    const dist = Math.sqrt(dx * dx + dy * dy * 2.5);
    if (dist < 0.5) {
      const glow = (1 - dist / 0.5) * 45;
      r += glow * 0.9;
      g += glow * 0.95;
      b += glow * 1.1;
    }

    // Grid lines
    if (x % 40 === 0 || y % 40 === 0) {
      r += 5; g += 6; b += 8;
    }

    setPixel(x, y, Math.min(255, Math.round(r)), Math.min(255, Math.round(g)), Math.min(255, Math.round(b)), 255);
  }
}

// Parametric line drawing (100% safe, no infinite loops)
function drawLine(x0, y0, x1, y1, r, g, b, a = 255, thickness = 1) {
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
        setPixel(cx + tx, cy + ty, r, g, b, a);
      }
    }
  }
}

// Framing border
drawLine(18, 18, width - 19, 18, 55, 62, 75, 255, 1);
drawLine(18, height - 19, width - 19, height - 19, 55, 62, 75, 255, 1);
drawLine(18, 18, 18, height - 19, 55, 62, 75, 255, 1);
drawLine(width - 19, 18, width - 19, height - 19, 55, 62, 75, 255, 1);

// Corner crosshairs
const corners = [
  [30, 30], [width - 31, 30],
  [30, height - 31], [width - 31, height - 31]
];
corners.forEach(([cx, cy]) => {
  drawLine(cx - 8, cy, cx + 8, cy, 180, 195, 215, 255, 1);
  drawLine(cx, cy - 8, cx, cy + 8, 180, 195, 215, 255, 1);
});

// Accent lines
drawLine(160, 205, 480, 205, 100, 115, 140, 180, 1);
drawLine(220, 225, 420, 225, 70, 85, 110, 150, 1);

// Draw stylized letters "USHIMA"
const startX = 135;
const startY = 115;
const charW = 46;
const charH = 64;
const gap = 20;
const strokeW = 4;
const silverR = 230;
const silverG = 235;
const silverB = 245;

// U
drawLine(startX, startY, startX, startY + charH - 6, silverR, silverG, silverB, 255, strokeW);
drawLine(startX + charW, startY, startX + charW, startY + charH - 6, silverR, silverG, silverB, 255, strokeW);
drawLine(startX + 4, startY + charH, startX + charW - 4, startY + charH, silverR, silverG, silverB, 255, strokeW);

// S
const sX = startX + (charW + gap);
drawLine(sX + 4, startY, sX + charW, startY, silverR, silverG, silverB, 255, strokeW);
drawLine(sX, startY + 4, sX, startY + charH / 2 - 2, silverR, silverG, silverB, 255, strokeW);
drawLine(sX + 2, startY + charH / 2, sX + charW - 2, startY + charH / 2, silverR, silverG, silverB, 255, strokeW);
drawLine(sX + charW, startY + charH / 2 + 2, sX + charW, startY + charH - 4, silverR, silverG, silverB, 255, strokeW);
drawLine(sX, startY + charH, sX + charW - 4, startY + charH, silverR, silverG, silverB, 255, strokeW);

// H
const hX = sX + (charW + gap);
drawLine(hX, startY, hX, startY + charH, silverR, silverG, silverB, 255, strokeW);
drawLine(hX + charW, startY, hX + charW, startY + charH, silverR, silverG, silverB, 255, strokeW);
drawLine(hX, startY + charH / 2, hX + charW, startY + charH / 2, silverR, silverG, silverB, 255, strokeW);

// I
const iX = hX + (charW + gap);
drawLine(iX + charW / 2, startY, iX + charW / 2, startY + charH, silverR, silverG, silverB, 255, strokeW);
drawLine(iX + 4, startY, iX + charW - 4, startY, silverR, silverG, silverB, 255, strokeW);
drawLine(iX + 4, startY + charH, iX + charW - 4, startY + charH, silverR, silverG, silverB, 255, strokeW);

// M
const mX = iX + (charW + gap);
drawLine(mX, startY, mX, startY + charH, silverR, silverG, silverB, 255, strokeW);
drawLine(mX + charW, startY, mX + charW, startY + charH, silverR, silverG, silverB, 255, strokeW);
drawLine(mX, startY, mX + charW / 2, startY + charH * 0.7, silverR, silverG, silverB, 255, strokeW);
drawLine(mX + charW, startY, mX + charW / 2, startY + charH * 0.7, silverR, silverG, silverB, 255, strokeW);

// A
const aX = mX + (charW + gap);
drawLine(aX, startY + charH, aX + charW / 2, startY, silverR, silverG, silverB, 255, strokeW);
drawLine(aX + charW, startY + charH, aX + charW / 2, startY, silverR, silverG, silverB, 255, strokeW);
drawLine(aX + charW * 0.22, startY + charH * 0.62, aX + charW * 0.78, startY + charH * 0.62, silverR, silverG, silverB, 255, strokeW);

// Subtle glow around letters
for (let y = 105; y < 190; y++) {
  for (let x = 120; x < 520; x++) {
    const pOff = y * (width * 4 + 1) + 1 + x * 4;
    if (rawData[pOff] > 210) {
      for (let ox = -2; ox <= 2; ox++) {
        for (let oy = -2; oy <= 2; oy++) {
          if (ox === 0 && oy === 0) continue;
          setPixel(x + ox, y + oy, 210, 225, 245, 30);
        }
      }
    }
  }
}

// Compress scanlines with zlib deflate
const compressedData = zlib.deflateSync(rawData, { level: 9 });

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuf, data]);

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < crcData.length; i++) {
    crc = crcTable[(crc ^ crcData[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = (crc ^ 0xffffffff) >>> 0;

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);
ihdrData.writeUInt32BE(height, 4);
ihdrData[8] = 8;
ihdrData[9] = 6;
ihdrData[10] = 0;
ihdrData[11] = 0;
ihdrData[12] = 0;

const ihdrChunk = createChunk('IHDR', ihdrData);
const idatChunk = createChunk('IDAT', compressedData);
const iendChunk = createChunk('IEND', Buffer.alloc(0));

const finalPng = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/telegram-banner-640x360.png', finalPng);
console.log('Successfully saved ./public/telegram-banner-640x360.png, size:', finalPng.length);
