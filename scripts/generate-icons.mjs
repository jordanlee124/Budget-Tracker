import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const buildDir = join(root, 'build');

const svgBuffer = readFileSync(join(buildDir, 'icon.svg'));

// Render at each size needed for an ICO (16, 24, 32, 48, 64, 128, 256)
const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngPaths = [];

for (const size of sizes) {
  const outPath = join(buildDir, `icon-${size}.png`);
  await sharp(svgBuffer, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  pngPaths.push(outPath);
  console.log(`  rendered ${size}x${size}`);
}

// Combine all sizes into one ICO
const icoBuffer = await pngToIco(pngPaths);
writeFileSync(join(buildDir, 'icon.ico'), icoBuffer);
console.log('  written build/icon.ico');

// Also write a 512-px PNG (used by electron-builder for other targets)
await sharp(svgBuffer, { density: 300 })
  .resize(512, 512)
  .png()
  .toFile(join(buildDir, 'icon.png'));
console.log('  written build/icon.png');
