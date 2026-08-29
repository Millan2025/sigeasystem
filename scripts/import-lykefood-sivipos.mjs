import puppeteer from "puppeteer";
import fs from "fs";

const SOURCE_URL = "https://lykefood.sivipos.co/";
const SIGEA_BASE = process.env.SIGEA_BASE || "https://sigea-system.vercel.app";
const TENANT_ID = process.env.TENANT_ID || "";
const DO_IMPORT = process.argv.includes("--import");

const CATEGORIES = [
  "Salchipapas",
  "Shawarma",
  "Salvajadas",
  "Perros",
  "Sandwich",
  "Mazorcas",
  "Hamburguesas",
  "Asados",
  "Picadas",
  "Lasanas",
  "Pizzas",
  "Pizzas Premium",
  "Patacones",
  "Panzerotti",
  "Adicionales",
  "Bebidas",
  "Promociones",
  "Menú Infantil",
  "Soda",
];

function cleanText(v = "") {
  return String(v)
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function parsePrice(v = "") {
  const s = String(v);
  const nums = s.replace(/[^\d]/g, "");
  if (!nums) return 0;
  return Number(nums);
}

function csvCell(v) {
  const s = String(v ?? "").replace(/"/g, '""').trim();
  if (s.includes(";") || s.includes("\n") || s.includes('"')) return `"${s}"`;
  return s;
}

function makeSku(name, index) {
  const base = cleanText(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 22);

  return `LYK-${String(index + 1).padStart(3, "0")}-${base || "PROD"}`;
}

function looksLikeProduct(obj) {
  if (!obj || typeof obj !== "object") return false;
  const keys = Object.keys(obj).map(k => k.toLowerCase());

  const hasName = keys.some(k =>
    ["nombre", "name", "title", "titulo", "producto", "product"].includes(k) ||
    k.includes("nombre") ||
    k.includes("name") ||
    k.includes("title")
  );

  const hasPrice = keys.some(k =>
    ["precio", "price", "valor", "amount"].includes(k) ||
    k.includes("precio") ||
    k.includes("price") ||
    k.includes("valor")
  );

  return hasName && hasPrice;
}

function extractFromJson(any, out = [], path = []) {
  if (!any) return out;

  if (Array.isArray(any)) {
    for (const item of any) extractFromJson(item, out, path);
    return out;
  }

  if (typeof any === "object") {
    if (looksLikeProduct(any)) {
      out.push(any);
    }

    for (const [k, v] of Object.entries(any)) {
      if (v && typeof v === "object") extractFromJson(v, out, path.concat(k));
    }
  }

  return out;
}

function normalizeJsonProduct(p, fallbackCategory = "") {
  const name =
    p.nombre ??
    p.name ??
    p.title ??
    p.titulo ??
    p.producto ??
    p.product ??
    "";

  const price =
    p.precio ??
    p.price ??
    p.valor ??
    p.amount ??
    p.precio_venta ??
    p.sale_price ??
    "";

  const category =
    p.categoria ??
    p.category ??
    p.categoria_nombre ??
    p.category_name ??
    fallbackCategory ??
    "";

  const description =
    p.descripcion ??
    p.description ??
    p.detalle ??
    p.detail ??
    "";

  const image =
    p.imagen ??
    p.image ??
    p.image_url ??
    p.foto ??
    p.photo ??
    p.url_imagen ??
    "";

  return {
    nombre: cleanText(name),
    precio: parsePrice(price),
    categoria: cleanText(category),
    descripcion: cleanText(description),
    imagen: cleanText(image),
    fuente: "json",
  };
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
      }, 120);
    });
  });
}

async function extractDomProducts(page, categoryHint = "") {
  return await page.evaluate((categoryHint) => {
    function cleanText(v = "") {
      return String(v).replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
    }

    function parsePrice(v = "") {
      const nums = String(v).replace(/[^\d]/g, "");
      return nums ? Number(nums) : 0;
    }

    const priceRegex = /(\$|\bCOP\b)?\s*\d{1,3}([.,]\d{3})+|\$\s*\d+/i;
    const nodes = Array.from(document.querySelectorAll("article, li, .card, [class*=card], [class*=product], [class*=producto], div"));

    const products = [];

    for (const el of nodes) {
      const text = cleanText(el.innerText || el.textContent || "");
      if (!text || text.length < 5 || text.length > 800) continue;
      if (!priceRegex.test(text)) continue;

      const img = el.querySelector("img")?.src || "";

      let name =
        el.querySelector("h1,h2,h3,h4,[class*=name],[class*=nombre],[class*=title],[class*=titulo]")?.textContent ||
        el.querySelector("img")?.alt ||
        "";

      name = cleanText(name);

      if (!name) {
        const lines = text.split(/\n| {2,}/).map(cleanText).filter(Boolean);
        name = lines.find(l => !priceRegex.test(l) && l.length > 2 && l.length < 90) || "";
      }

      const priceText = text.match(priceRegex)?.[0] || "";
      const price = parsePrice(priceText);

      if (!name || !price) continue;

      products.push({
        nombre: name,
        precio: price,
        categoria: categoryHint || "",
        descripcion: "",
        imagen: img,
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
        fuente: old.fuente === "json" ? old.fuente : p.fuente,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    return `${a.categoria} ${a.nombre}`.localeCompare(`${b.categoria} ${b.nombre}`);
  });
}

function buildCsv(products) {
  const header = [
    "SECCION",
    "SKU",
    "NOMBRE",
    "PRECIO",
    "COSTO",
    "STOCK_INICIAL",
    "ES_RECETA",
    "UNIDAD_MEDIDA",
    "PRECIO_POR_KG",
    "CATEGORIA",
    "PROVEEDOR",
    "PROVEEDOR_TELEFONO",
  ];

  const rows = products.map((p, i) => [
    "PRODUCTO",
    makeSku(p.nombre, i),
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
  ]);

  return "\uFEFF" + [header, ...rows].map(row => row.map(csvCell).join(";")).join("\n");
}

async function main() {
  console.log("==========================================");
  console.log("  EXTRACCIÓN PRODUCTOS LYKE FOOD SIVIPOS");
  console.log("==========================================");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 900 },
  });

  const page = await browser.newPage();

  const networkProducts = [];

  page.on("response", async (res) => {
    try {
      const ct = res.headers()["content-type"] || "";
      if (!ct.includes("application/json")) return;

      const json = await res.json();
      const found = extractFromJson(json);

      if (found.length) {
        console.log(`[JSON] ${found.length} candidatos desde ${res.url()}`);
        for (const item of found) {
          networkProducts.push(normalizeJsonProduct(item));
        }
      }
    } catch {}
  });

  console.log(`Abriendo: ${SOURCE_URL}`);
  await page.goto(SOURCE_URL, { waitUntil: "networkidle2", timeout: 60000 });
  await autoScroll(page);

  let all = [];

  const homeProducts = await extractDomProducts(page, "");
  all.push(...homeProducts);

  console.log(`[HOME] DOM productos: ${homeProducts.length}`);

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
      console.log(`  ⚠️ No encontré botón/enlace exacto para: ${cat}`);
      continue;
    }

    await new Promise(r => setTimeout(r, 1500));
    await autoScroll(page);

    const domProducts = await extractDomProducts(page, cat);
    console.log(`  DOM productos: ${domProducts.length}`);

    all.push(...domProducts);
  }

  await browser.close();

  all.push(...networkProducts);

  const products = dedupe(all);

  console.log("\n==========================================");
  console.log(`Productos únicos encontrados: ${products.length}`);
  console.log("==========================================");

  fs.writeFileSync("productos-lykefood.raw.json", JSON.stringify(products, null, 2), "utf8");

  const csv = buildCsv(products);
  fs.writeFileSync("productos-lykefood-sigea.csv", csv, "utf8");

  console.log("✅ Generado: productos-lykefood.raw.json");
  console.log("✅ Generado: productos-lykefood-sigea.csv");

  console.log("\nPrimeros 10 productos:");
  console.table(products.slice(0, 10).map(p => ({
    categoria: p.categoria,
    nombre: p.nombre,
    precio: p.precio,
    fuente: p.fuente,
  })));

  if (!DO_IMPORT) {
    console.log("\nℹ️ Modo revisión solamente.");
    console.log("   Revisa productos-lykefood-sigea.csv");
    console.log("   Luego ejecuta con --import para subir a SIGEA.");
    return;
  }

  if (!TENANT_ID) {
    console.error("❌ Falta TENANT_ID.");
    console.error("Ejemplo PowerShell:");
    console.error('$env:TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"');
    process.exit(1);
  }

  console.log("\nImportando a SIGEA...");
  console.log(`Tenant: ${TENANT_ID}`);

  const fd = new FormData();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  fd.append("file", blob, "productos-lykefood-sigea.csv");
  fd.append("tenant_id", TENANT_ID);

  const resp = await fetch(`${SIGEA_BASE}/api/admin/products/import`, {
    method: "POST",
    body: fd,
  });

  const text = await resp.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!resp.ok) {
    console.error("❌ Error importando:");
    console.error(data);
    process.exit(1);
  }

  console.log("✅ Importación finalizada:");
  console.log(data);
}

main().catch(err => {
  console.error("❌ Error general:");
  console.error(err);
  process.exit(1);
});
