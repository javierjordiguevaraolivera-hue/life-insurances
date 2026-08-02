import { buildVercelLocation } from "../../lib/location.js";
import { getGeolocation } from "../../lib/request-helpers.js";

const ZIP_LOOKUP_TIMEOUT_MS = 1500;

async function lookupZip(zip) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ZIP_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const place = data.places?.[0];

    if (!place?.["place name"] || !place.state) {
      return null;
    }

    return {
      location: `${place["place name"]}, ${place.state}`,
      source: "zippopotam",
      city: place["place name"],
      country: "US",
      state: place.state,
      zipCode: data["post code"] || zip,
      fallback: false,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(req, res) {
  const zip = String(req.query.zip || "");
  const strictZippopotam = String(req.query.strict || "") === "zippopotam";

  if (!/^\d{5}$/.test(zip)) {
    res.status(400).json({ error: "Invalid ZIP code" });
    return;
  }

  const zipLocation = await lookupZip(zip);

  if (zipLocation) {
    res.status(200).json(zipLocation);
    return;
  }

  if (strictZippopotam) {
    res.status(404).json({ error: "ZIP code not found" });
    return;
  }

  const ipLocation = buildVercelLocation(getGeolocation(req));

  if (ipLocation) {
    res.status(200).json(ipLocation);
    return;
  }

  res.status(200).json({
    location: "Rates available for your area",
    source: "fallback",
    city: null,
    country: null,
    state: null,
    zipCode: null,
    fallback: true,
  });
}
