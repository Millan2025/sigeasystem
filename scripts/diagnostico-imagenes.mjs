import puppeteer from "puppeteer";
import fs from "fs";

const URL = "https://lykefood.sivipos.co/";

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1366, height: 900 } });
  const page = await browser.newPage();

  // Capturar TODAS las imágenes de red
  const imageUrls = new Set();
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (ct.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif)/i.test(url)) {
      imageUrls.add(url);
    }
  });

  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));

  // Ir a la categoría "Hamburguesas" (suele tener imágenes)
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("button,a,div,span"));
    const target = els.find(e => (e.innerText || "").trim().toLowerCase() === "hamburguesas");
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  console.log("\n=== 1. IMÁGENES CAPTURADAS DE RED ===");
  console.log(`Total: ${imageUrls.size}`);
  [...imageUrls].slice(0, 20).forEach(u => console.log(`  ${u}`));

  console.log("\n=== 2. TAGS <img> EN EL DOM ===");
  const imgs = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll("img").forEach((img, i) => {
      result.push({
        index: i,
        src: img.src || "",
        currentSrc: img.currentSrc || "",
        dataSrc: img.getAttribute("data-src") || "",
        dataLazy: img.getAttribute("data-lazy") || "",
        alt: img.alt || "",
        width: img.naturalWidth,
        height: img.naturalHeight,
        visible: img.offsetParent !== null,
      });
    });
    return result;
  });
  console.log(`Total <img>: ${imgs.length}`);
  imgs.slice(0, 15).forEach(img => {
    console.log(`  [${img.index}] src=${img.src.substring(0, 100)} | visible=${img.visible} | size=${img.width}x${img.height}`);
  });

  console.log("\n=== 3. BACKGROUND-IMAGE EN CSS ===");
  const bgImages = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll("*").forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== "none" && bg.includes("url(")) {
        result.push({
          tag: el.tagName,
          class: el.className?.toString().substring(0, 50) || "",
          bg: bg.substring(0, 150),
        });
      }
    });
    return result.slice(0, 10);
  });
  bgImages.forEach(b => console.log(`  ${b.tag}.${b.class}: ${b.bg}`));

  console.log("\n=== 4. TARJETA DE PRODUCTO (HTML crudo) ===");
  const productCard = await page.evaluate(() => {
    // Buscar un elemento que contenga precio tipo $8.000
    const els = Array.from(document.querySelectorAll("div, article, li"));
    const card = els.find(el => {
      const t = el.innerText || "";
      return /\$\s*\d{1,3}([.,]\d{3})+/.test(t) && t.length < 500 && el.children.length > 0;
    });
    return card ? card.outerHTML.substring(0, 2000) : "NO ENCONTRADA";
  });
  console.log(productCard);

  console.log("\n=== 5. JSONs CON PRODUCTOS EN NETWORK ===");
  const jsonUrls = [];
  page.on("response", async (res) => {
    const ct = res.headers()["content-type"] || "";
    if (ct.includes("application/json")) {
      try {
        const text = await res.text();
        if (text.includes("producto") || text.includes("precio") || text.includes("categoria")) {
          jsonUrls.push({ url: res.url(), preview: text.substring(0, 300) });
        }
      } catch {}
    }
  });

  // Navegar a otra categoría para disparar requests
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("button,a,div,span"));
    const target = els.find(e => (e.innerText || "").trim().toLowerCase() === "pizzas");
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  console.log(`JSONs detectados: ${jsonUrls.length}`);
  jsonUrls.slice(0, 5).forEach(j => {
    console.log(`\n  URL: ${j.url}`);
    console.log(`  Preview: ${j.preview.substring(0, 200)}`);
  });

  await browser.close();

  fs.writeFileSync("diagnostico-imagenes.txt",
    JSON.stringify({ imageUrls: [...imageUrls], imgs: imgs.slice(0, 30), bgImages, productCard, jsonUrls }, null, 2),
    "utf8"
  );
  console.log("\n✅ Diagnóstico completo guardado en diagnostico-imagenes.txt");
})();
