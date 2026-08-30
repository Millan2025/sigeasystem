import sharp from "sharp";
import fs from "fs";

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0c0a09"/>
  <rect x="26" y="26" width="460" height="460" rx="100" fill="#fdb813"/>
  <circle cx="256" cy="170" r="58" fill="#0c0a09"/>
  <rect x="146" y="252" width="220" height="52" rx="26" fill="#0c0a09"/>
  <rect x="176" y="330" width="160" height="44" rx="22" fill="#0c0a09"/>
</svg>`;

fs.mkdirSync("public/icons", { recursive: true });
const buf = Buffer.from(svg);

await sharp(buf).resize(32, 32).png().toFile("public/icons/favicon-32.png");
await sharp(buf).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
await sharp(buf).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(buf).resize(512, 512).png().toFile("public/icons/icon-512.png");
console.log("✅ Iconos generados en public/icons");
