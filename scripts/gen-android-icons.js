const sharp = require('sharp');
const path = require('path');
const OUT_DIR = path.join(__dirname, '..', 'devkit-android', 'app', 'src', 'main', 'res');

function launcherIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#9b7cff"/>
        <stop offset="100%" stop-color="#4dd4ff"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#g)" rx="${Math.round(size * 0.18)}"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
          font-family="Geist, system-ui, -apple-system, sans-serif"
          font-weight="800" font-size="${Math.round(size * 0.55)}" fill="#0d0f1f">D</text>
  </svg>`;
}

async function main() {
  const sizes = [
    ['mipmap-mdpi', 48],
    ['mipmap-hdpi', 72],
    ['mipmap-xhdpi', 96],
    ['mipmap-xxhdpi', 144],
    ['mipmap-xxxhdpi', 192],
  ];
  for (const [dir, size] of sizes) {
    const buf = Buffer.from(launcherIcon(size));
    await sharp(buf).png().toFile(path.join(OUT_DIR, dir, 'ic_launcher.png'));
    await sharp(buf).png().toFile(path.join(OUT_DIR, dir, 'ic_launcher_round.png'));
    console.log(`Generated ${dir} ${size}x${size}`);
  }
  await sharp(Buffer.from(launcherIcon(512))).png().toFile(path.join(OUT_DIR, 'ic_launcher_playstore.png'));
  console.log('Generated Play Store 512x512');
}
main().catch((e) => { console.error(e); process.exit(1); });
