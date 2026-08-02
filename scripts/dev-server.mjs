// Servidor de desarrollo local: sirve la raiz del proyecto como estatico y
// monta las funciones de /api con la misma firma (req, res) que usa Vercel.
// Solo para desarrollo; en produccion Vercel hace esto automaticamente.
// Adaptado de seguro-de-vida-online (alli lo estatico vive en /public; aqui
// vive en la raiz, por eso hay una denylist de rutas internas).

import { createServer } from "node:http";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const apiDir = path.join(root, "api");
const PORT = Number(process.env.PORT || 3025);

// Nunca servir como estatico: codigo de servidor, dependencias y secretos.
const DENYLIST_PREFIXES = ["/api/", "/lib/", "/scripts/", "/node_modules/", "/.git/"];
const DENYLIST_EXACT = new Set([
  "/package.json",
  "/package-lock.json",
  "/vercel.json",
]);

// Carga .env.local (equivalente a lo que hace Vercel en dev)
try {
  const envFile = await readFile(path.join(root, ".env.local"), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !line.trim().startsWith("#") && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
} catch {
  console.warn("No se encontro .env.local; las APIs con credenciales quedaran limitadas.");
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

function enhanceRes(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (value) {
    if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(value));
    return res;
  };
  res.send = function (value) {
    res.end(value);
    return res;
  };
  return res;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  const contentType = String(req.headers["content-type"] || "");
  if (contentType.includes("application/json") || raw.startsWith("{") || raw.startsWith("[")) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function isDeniedPath(pathname) {
  if (DENYLIST_EXACT.has(pathname)) return true;
  if (DENYLIST_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  // dotfiles en cualquier segmento (.env.local, .gitignore, .git, etc.)
  return pathname.split("/").some((segment) => segment.startsWith(".") && segment.length > 1);
}

async function tryServeStatic(pathname, res) {
  if (isDeniedPath(pathname)) return false;

  const candidates = [];
  const clean = pathname === "/" ? "/index.html" : pathname;
  candidates.push(path.join(root, clean));
  if (!path.extname(clean)) {
    candidates.push(path.join(root, clean + ".html"));
    candidates.push(path.join(root, clean, "index.html"));
  }

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (!normalized.startsWith(root)) continue;
    try {
      await access(normalized);
      const data = await readFile(normalized);
      res.statusCode = 200;
      res.setHeader("Content-Type", MIME[path.extname(normalized).toLowerCase()] || "application/octet-stream");
      res.end(data);
      return true;
    } catch {
      // siguiente candidato
    }
  }
  return false;
}

async function handleApi(pathname, req, res) {
  const parts = pathname.replace(/^\/api\//, "").split("/").filter(Boolean);
  if (parts.length === 0) return false;

  let filePath = null;
  const query = Object.fromEntries(new URL(req.url, "http://localhost").searchParams.entries());

  const direct = path.join(apiDir, parts.join("/") + ".js");
  try {
    await access(direct);
    filePath = direct;
  } catch {
    // ruta dinamica /api/zip/[zip].js
    if (parts.length === 2 && parts[0] === "zip") {
      const dynamic = path.join(apiDir, "zip", "[zip].js");
      try {
        await access(dynamic);
        filePath = dynamic;
        query.zip = parts[1];
      } catch {
        filePath = null;
      }
    }
  }

  if (!filePath) return false;

  const mod = await import(pathToFileURL(filePath).href + "?t=" + Date.now());
  const handler = mod.default;
  req.query = query;
  req.body = await readBody(req);
  enhanceRes(res);
  try {
    await handler(req, res);
  } catch (error) {
    console.error("API error", pathname, error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal error (dev server)" });
    }
  }
  return true;
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");

  if (pathname.startsWith("/api/")) {
    const handled = await handleApi(pathname, req, res);
    if (!handled) {
      res.statusCode = 404;
      res.end("Not found");
    }
    return;
  }

  const served = await tryServeStatic(pathname, res);
  if (!served) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Dev server listo en http://localhost:${PORT}`);
});
