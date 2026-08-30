import sharp from "sharp";
import fs from "fs";

fs.mkdirSync("public/icons", { recursive: true });
fs.mkdirSync("src/app", { recursive: true });

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFD36A"/>
      <stop offset="45%" stop-color="#FDB813"/>
      <stop offset="100%" stop-color="#B8860B"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="512" height="512" rx="110" fill="#0c0a09"/>
  <rect x="34" y="34" width="444" height="444" rx="96" fill="url(#gold)" filter="url(#shadow)"/>
  <rect x="62" y="62" width="388" height="388" rx="78" fill="#111111" opacity="0.96"/>

  <text
    x="256"
    y="318"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="250"
    font-weight="900"
    fill="url(#gold)"
    letter-spacing="-8"
  >S</text>

  <text
    x="256"
    y="390"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="48"
    font-weight="800"
    fill="#FDB813"
    letter-spacing="6"
  >SIGEA</text>
</svg>
`;

const input = Buffer.from(svg);

// PNG principales
await sharp(input).resize(16, 16).png().toFile("public/favicon-16x16.png");
await sharp(input).resize(32, 32).png().toFile("public/favicon-32x32.png");
await sharp(input).resize(32, 32).png().toFile("public/icons/favicon-32.png");
await sharp(input).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(input).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
await sharp(input).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(input).resize(512, 512).png().toFile("public/icons/icon-512.png");

// Next.js App Router special files
await sharp(input).resize(192, 192).png().toFile("src/app/icon.png");
await sharp(input).resize(180, 180).png().toFile("src/app/apple-icon.png");

// Favicon root. Modern browsers aceptan PNG aunque el nombre sea favicon.ico.
// Esto evita que siga apareciendo el favicon default de Vercel.
await sharp(input).resize(32, 32).png().toFile("public/favicon.ico");
await sharp(input).resize(32, 32).png().toFile("src/app/favicon.ico");

console.log("✅ Iconos SIGEA generados con S dorada");
