// Helpers para funciones Node de Vercel (equivalentes a geolocation/ipAddress
// de @vercel/functions, que en Next reciben un Request web; aqui leemos los
// mismos headers x-vercel-* directamente del IncomingMessage).

function header(req, name) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value || "";
}

export function getRequestIp(req) {
  return (
    header(req, "x-real-ip") ||
    header(req, "x-forwarded-for").split(",")[0]?.trim() ||
    ""
  );
}

export function getGeolocation(req) {
  const decode = (value) => {
    try {
      return value ? decodeURIComponent(value) : undefined;
    } catch {
      return value || undefined;
    }
  };

  return {
    city: decode(header(req, "x-vercel-ip-city")),
    country: header(req, "x-vercel-ip-country") || undefined,
    flag: undefined,
    countryRegion: header(req, "x-vercel-ip-country-region") || undefined,
    region: header(req, "x-vercel-id") || undefined,
    latitude: header(req, "x-vercel-ip-latitude") || undefined,
    longitude: header(req, "x-vercel-ip-longitude") || undefined,
    postalCode: header(req, "x-vercel-ip-postal-code") || undefined,
  };
}

export function getRequestCookie(req, name) {
  const cookieHeader = header(req, "cookie");
  const cookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) return "";

  return decodeURIComponent(cookie.slice(name.length + 1));
}

export function isAllowedOrigin(req) {
  const origin = header(req, "origin");
  const host = header(req, "host");

  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export async function readJsonBody(req) {
  // Vercel ya parsea el body JSON en req.body; el dev server local tambien.
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return null;
      }
    }
    return req.body;
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
