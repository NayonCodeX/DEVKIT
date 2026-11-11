// Generate PWA icons for DEVKIT using sharp.
/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'devkit');

function svg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#9b7cff"/>
        <stop offset="100%" stop-color="#4dd4ff"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="#0d0f1f" rx="${Math.round(size * 0.18)}"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
          font-family="Geist, system-ui, -apple-system, sans-serif"
          font-weight="800" font-size="${Math.round(size * 0.55)}" fill="url(#g)">D</text>
  </svg>`;
}

async function main() {
  await sharp(Buffer.from(svg(192))).png().toFile(path.join(ICONS_DIR, 'icon-192.png'));
  await sharp(Buffer.from(svg(512))).png().toFile(path.join(ICONS_DIR, 'icon-512.png'));
  await sharp(Buffer.from(svg(512))).png().toFile(path.join(ICONS_DIR, 'icon-512-maskable.png'));
  console.log('Icons generated');
}
main().catch((e) => { console.error(e); process.exit(1); });
