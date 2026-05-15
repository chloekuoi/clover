/**
 * generate-icon.js
 * Generates all Clover brand icon and splash assets as PNGs from SVG.
 *
 * Usage: node scripts/generate-icon.js
 */

const sharp = require('sharp');
const path = require('path');

const FOREST  = '#0c1f0e';
const LAVENDER = '#ede8ff';

const assetsDir = path.join(__dirname, '..', 'assets');

/**
 * Generates the Clover mark SVG string at a given canvas size.
 *
 * The clover mark is defined in a 80×80 viewBox:
 *   Petals at top (40,23), right (57,40), bottom (40,57), left (23,40) — radius 18
 *   Centre cutout at (40,40) — radius 10
 *
 * @param {number}  size      Canvas size in px (width = height)
 * @param {string}  bgColor   Background fill ('transparent' for no bg)
 * @param {string}  markColor Petal fill colour
 * @param {number}  padding   Fractional padding around the mark (0–0.5)
 */
function makeCloverSVG(size, bgColor, markColor, padding = 0.12) {
  const inner = size * (1 - padding * 2);
  const scale = inner / 80;
  const off   = size * padding;

  const cx = x  => (off + x  * scale).toFixed(2);
  const cy = y  => (off + y  * scale).toFixed(2);
  const r  = rv => (rv * scale).toFixed(2);

  const bg = bgColor === 'transparent'
    ? ''
    : `<rect width="${size}" height="${size}" fill="${bgColor}"/>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${bg}
  <circle cx="${cx(40)}" cy="${cy(23)}" r="${r(18)}" fill="${markColor}"/>
  <circle cx="${cx(57)}" cy="${cy(40)}" r="${r(18)}" fill="${markColor}"/>
  <circle cx="${cx(40)}" cy="${cy(57)}" r="${r(18)}" fill="${markColor}"/>
  <circle cx="${cx(23)}" cy="${cy(40)}" r="${r(18)}" fill="${markColor}"/>
  <circle cx="${cx(40)}" cy="${cy(40)}" r="${r(10)}" fill="${bgColor === 'transparent' ? 'none' : bgColor}"/>
</svg>`;
}

async function generate() {
  const tasks = [
    {
      file: 'icon.png',
      desc: 'App icon (iOS) — 1024×1024, lavender bg, forest mark',
      svg:  makeCloverSVG(1024, LAVENDER, FOREST, 0.14),
    },
    {
      file: 'adaptive-icon.png',
      desc: 'Android adaptive icon foreground — 1024×1024, lavender bg, forest mark',
      // Android backgroundColor is set to lavender in app.json; foreground uses same lavender bg
      svg:  makeCloverSVG(1024, LAVENDER, FOREST, 0.20),
    },
    {
      file: 'splash-icon.png',
      desc: 'Splash screen icon — 200×200, transparent bg, forest mark',
      svg:  makeCloverSVG(200, LAVENDER, FOREST, 0.10),
    },
    {
      file: 'favicon.png',
      desc: 'Web favicon — 48×48, lavender bg, forest mark',
      svg:  makeCloverSVG(48, LAVENDER, FOREST, 0.12),
    },
  ];

  for (const task of tasks) {
    const filePath = path.join(assetsDir, task.file);
    await sharp(Buffer.from(task.svg))
      .png()
      .toFile(filePath);
    console.log(`✓  ${task.file}  —  ${task.desc}`);
  }

  console.log('\nAll icon assets generated successfully.');
  console.log('Remember to update app.json:');
  console.log('  - name: "clover"');
  console.log('  - splash.backgroundColor: "#ede8ff"');
  console.log('  - android.adaptiveIcon.backgroundColor: "#ede8ff"');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
