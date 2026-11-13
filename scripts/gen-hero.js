// Generate a hero banner for the GitHub README.
const sharp = require('sharp');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

function bannerSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="320" viewBox="0 0 1280 320">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0d0f1f"/>
        <stop offset="100%" stop-color="#1a1f3a"/>
      </linearGradient>
      <linearGradient id="d" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#9b7cff"/>
        <stop offset="100%" stop-color="#4dd4ff"/>
      </linearGradient>
      <linearGradient id="text" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#c9d4ff"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="320" fill="url(#bg)"/>
    <!-- Grid -->
    <g stroke="rgba(155,124,255,0.06)" stroke-width="1">
      ${Array.from({length: 41}, (_, i) => `<line x1="${i*32}" y1="0" x2="${i*32}" y2="320"/>`).join('')}
      ${Array.from({length: 11}, (_, i) => `<line x1="0" y1="${i*32}" x2="1280" y2="${i*32}"/>`).join('')}
    </g>
    <!-- </> logo badge -->
    <rect x="80" y="100" width="120" height="120" rx="28" fill="url(#d)"/>
    <text x="140" y="190" text-anchor="middle" dominant-baseline="central"
          font-family="Geist, monospace, system-ui, sans-serif" font-weight="800" font-size="56" fill="#0d0f1f">&lt;/&gt;</text>
    <!-- Title -->
    <text x="240" y="160" font-family="Geist, system-ui, sans-serif" font-weight="800" font-size="84" fill="url(#text)" letter-spacing="-2">DEVKIT</text>
    <text x="240" y="210" font-family="Geist, system-ui, sans-serif" font-weight="500" font-size="28" fill="#9b7cff" letter-spacing="2">BUILD SMARTER. CODE BETTER.</text>
    <!-- Badges -->
    <g transform="translate(240, 240)">
      <rect x="0" y="0" width="180" height="36" rx="18" fill="rgba(155,124,255,0.15)" stroke="#9b7cff" stroke-width="1"/>
      <text x="90" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#9b7cff" font-weight="600">v1.0.3 · PWA · APK</text>
      <rect x="200" y="0" width="140" height="36" rx="18" fill="rgba(77,212,255,0.15)" stroke="#4dd4ff" stroke-width="1"/>
      <text x="270" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#4dd4ff" font-weight="600">NEXT.JS · TS · KOTLIN</text>
      <rect x="360" y="0" width="200" height="36" rx="18" fill="rgba(34,197,94,0.15)" stroke="#22c55e" stroke-width="1"/>
      <text x="460" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#22c55e" font-weight="600">30 TOOLS · AI · GITHUB</text>
    </g>
  </svg>`;
}

async function main() {
  await sharp(Buffer.from(bannerSvg())).png().toFile(path.join(OUT_DIR, '00-hero.png'));
  console.log('Hero banner generated');
}
main().catch((e) => { console.error(e); process.exit(1); });
