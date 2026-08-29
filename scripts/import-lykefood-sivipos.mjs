import puppeteer from "puppeteer";
import fs from "fs";

const SOURCE_URL = "https://lykefood.sivipos.co/";
const SIGEA_BASE = process.env.SIGEA_BASE || "https://sigea-system.vercel.app";
const TENANT_ID = process.env.TENANT_ID || "";
const DO_IMPORT = process.argv.includes("--import");

const CATEGORIES = [
  "Salchipapas", "Shawarma", "Salvajadas", "Perros", "Sandwich",
  "Mazorcas", "Hamburguesas", "Asados", "Picadas", "Lasanas",
  "Pizzas", "Pizzas Premium", "Patacones", "Panzerotti", "Adicionales",
  "Bebidas", "Promociones", "Menú Infantil", "Soda",
];

function cleanText(v = "") {
  return String(v).replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function parsePrice(v = "") {
  const nums = String(v).replace(/[^\d]/g, "");
  return nums ? Number(nums) : 0;
}

function csvCell(v) {
  const s = String(v ?? "").replace(/"/g, '""').trim();
  if (s.includes(";") || s.includes("\n") || s.includes('"')) return `"${s}"`;
  return s;
}

function makeSku(name, categoria) {
  const slug = (s) => cleanText(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .toUpperCase().slice(0, 18);
  return `LYK-${slug(categoria) || "GEN"}-${slug(name) || "PROD"}`;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let total = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        total += distance;
        if (total >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function extractProductsFromCategory(page, categoryHint = "") {
  return await page.evaluate((categoryHint) => {
    function cleanText(v = "") {
      return String(v).replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
    }
    function parsePrice(v = "") {
      const nums = String(v).replace(/[^\d]/g, "");
      return nums ? Number(nums) : 0;
    }

    const priceRegex = /(\$|\bCOP\b)?\s*\d{1,3}([.,]\d{3})+|\$\s*\d+/i;
    const products = [];

    // Buscar TODAS las imágenes de productos (patrón: app.sivipos.co/img/productos/)
    const productImages = Array.from(document.querySelectorAll('img[src*="app.sivipos.co/img/productos/"]'));

    for (const img of productImages) {
      const imgSrc = img.src || img.currentSrc || "";
      
      // Subir en el DOM para encontrar el contenedor del producto
      let container = img.parentElement;
      let attempts = 0;
      while (container && attempts < 8) {
        const text = container.innerText || "";
        if (priceRegex.test(text) && text.length < 1000) {
          break;
        }
        container = container.parentElement;
        attempts++;
      }

      if (!container) continue;

      const text = cleanText(container.innerText || "");
      if (!priceRegex.test(text)) continue;

      // Extraer nombre: buscar en h1-h4, o primera línea no-precio
      let name = "";
      const h = container.querySelector("h1,h2,h3,h4,h5,h6,[class*=name],[class*=nombre],[class*=title],[class*=titulo]");
      if (h) name = cleanText(h.textContent);
      
      if (!name) {
        const lines = text.split(/\n| {2,}/).map(cleanText).filter(Boolean);
        name = lines.find(l => !priceRegex.test(l) && l.length > 2 && l.length < 100) || "";
      }
      name = cleanText(name);

      // Extraer precio
      const priceMatch = text.match(priceRegex);
      const price = priceMatch ? parsePrice(priceMatch[0]) : 0;

      // Extraer descripción: párrafos o líneas sin precio
      let desc = "";
      const ps = container.querySelectorAll("p,[class*=desc],[class*=description]");
      if (ps.length) {
        const descTexts = Array.from(ps)
          .map(p => cleanText(p.textContent))
          .filter(t => t && t !== name && !priceRegex.test(t) && t.length < 300);
        desc = descTexts.join(" - ");
      }

      if (!name || !price) continue;

      products.push({
        nombre: name,
        precio: price,
        categoria: categoryHint || "",
        descripcion: desc.slice(0, 500),
        imagen: imgSrc,
        fuente: "dom",
      });
    }

    return products;
  }, categoryHint);
}

function dedupe(products) {
  const map = new Map();
  for (const p of products) {
    if (!p.nombre || !p.precio) continue;
    const key = `${p.categoria}|${p.nombre}|${p.precio}`.toLowerCase();
    if (!map.has(key)) {
      map.set(key, p);
    } else {
      const old = map.get(key);
      map.set(key, {
        ...old,
        descripcion: old.descripcion || p.descripcion,
        imagen: old.imagen || p.imagen,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => `${a.categoria} ${a.nombre}`.localeCompare(`${b.categoria} ${b.nombre}`));
}

function buildCsv(products) {
  const header = [
    "SECCION", "SKU", "NOMBRE", "PRECIO", "COSTO", "STOCK_INICIAL",
    "ES_RECETA", "UNIDAD_MEDIDA", "PRECIO_POR_KG", "CATEGORIA",
    "PROVEEDOR", "PROVEEDOR_TELEFONO", "DESCRIPCION", "IMAGEN_URL",
  ];

  const rows = products.map((p, i) => [
    "PRODUCTO",
    makeSku(p.nombre, p.categoria),
    p.nombre,
    p.precio,
    0,
    0,
    "NO",
    "unidad",
    "",
    p.categoria || "General",
    "",
    "",
    p.descripcion || "",
    p.imagen || "",
  ]);

  return "\uFEFF" + [header, ...rows].map(row => row.map(csvCell).join(";")).join("\n");
}

async function main() {
  console.log("==========================================");
  console.log("  SCRAPER DEFINITIVO CON IMÁGENES");
  console.log("==========================================");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 900 },
  });

  const page = await browser.newPage();

  console.log(`Abriendo: ${SOURCE_URL}`);
  await page.goto(SOURCE_URL, { waitUntil: "networkidle2", timeout: 60000 });
  await autoScroll(page);

  let all = [];

  for (const cat of CATEGORIES) {
    console.log(`\n[CATEGORÍA] ${cat}`);

    const clicked = await page.evaluate((cat) => {
      const normalize = s => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
      const target = normalize(cat);
      const els = Array.from(document.querySelectorAll("button,a,div,span,p,h1,h2,h3"));
      const el = els.find(e => normalize(e.innerText || e.textContent) === target);
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "center" });
        el.click();
        return true;
      }
      return false;
    }, cat);

    if (!clicked) {
      console.log(`  ⚠️ No encontré botón para: ${cat}`);
      continue;
    }

    await new Promise(r => setTimeout(r, 2500));
    await autoScroll(page);

    const products = await extractProductsFromCategory(page, cat);
    const conImagen = products.filter(p => p.imagen).length;
    const conDesc = products.filter(p => p.descripcion).length;
    
    console.log(`  Productos: ${products.length} (${conImagen} con imagen, ${conDesc} con desc)`);
    all.push(...products);
  }

  await browser.close();

  const products = dedupe(all);
  const conImagen = products.filter(p => p.imagen).length;
  const conDesc = products.filter(p => p.descripcion).length;

  console.log("\n==========================================");
  console.log(`Productos únicos: ${products.length}`);
  console.log(`Con imagen: ${conImagen} (${Math.round(conImagen/products.length*100)}%)`);
  console.log(`Con descripción: ${conDesc}`);
  console.log("==========================================");

  fs.writeFileSync("productos-lykefood.raw.json", JSON.stringify(products, null, 2), "utf8");
  const csv = buildCsv(products);
  fs.writeFileSync("productos-lykefood-sigea.csv", csv, "utf8");

  console.log("\n✅ CSV generado con imágenes reales");
  console.log("\nMuestra de 5 productos:");
  console.table(products.slice(0, 5).map(p => ({
    categoria: p.categoria,
    nombre: p.nombre,
    precio: p.precio,
    imagen: p.imagen ? "✅" : "❌",
    desc: p.descripcion ? "✅" : "❌",
  })));

  if (!DO_IMPORT) return;

  if (!TENANT_ID) {
    console.error("❌ Falta TENANT_ID");
    process.exit(1);
  }

  console.log("\nImportando a SIGEA (UPSERT por SKU)...");
  const fd = new FormData();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  fd.append("file", blob, "productos-lykefood-sigea.csv");
  fd.append("tenant_id", TENANT_ID);

  const resp = await fetch(`${SIGEA_BASE}/api/admin/products/import`, { method: "POST", body: fd });
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!resp.ok) {
    console.error("❌ Error:", data);
    process.exit(1);
  }

  console.log("✅ Importación finalizada:");
  console.log(data);
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
