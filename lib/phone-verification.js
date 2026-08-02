// Verificacion de telefono con Veriphone + token HMAC firmado.
// Portado 1:1 de best-life lib/phone-verification.ts (TypeScript -> JS).

import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeUsPhone } from "./phone.js";

const VERIPHONE_TIMEOUT_MS = 3500;
const PHONE_TOKEN_TTL_MS = 15 * 60 * 1000;
const allowedPhoneTypes = new Set(["mobile", "fixed_line", "fixed_line_or_mobile"]);

function isPlaceholder(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return (
    !normalized ||
    normalized.includes("placeholder") ||
    normalized.includes("your_api_key") ||
    normalized.includes("replace_me") ||
    normalized === "changeme" ||
    normalized === "veriphone_api_key"
  );
}

function getApiKey() {
  const apiKey = process.env.VERIPHONE_API_KEY?.trim() || "";
  return isPlaceholder(apiKey) ? "" : apiKey;
}

function getSigningSecret() {
  const configuredSecret = process.env.PHONE_VERIFICATION_SECRET?.trim() || "";
  const secret = !isPlaceholder(configuredSecret) ? configuredSecret : getApiKey();
  return secret ? `best-life:phone-verification:v1:${secret}` : "";
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function signEncodedPayload(encodedPayload, secret) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createPhoneVerificationToken(normalizedPhone, now = Date.now()) {
  const secret = getSigningSecret();
  const normalized = normalizeUsPhone(normalizedPhone);
  if (!secret || normalized.length !== 10) return null;

  const payload = {
    normalized,
    issuedAt: now,
    expiresAt: now + PHONE_TOKEN_TTL_MS,
  };
  const encodedPayload = encodeJson(payload);
  return `${encodedPayload}.${signEncodedPayload(encodedPayload, secret)}`;
}

export function validatePhoneVerificationToken(token, expectedPhone, now = Date.now()) {
  const secret = getSigningSecret();
  const normalized = normalizeUsPhone(expectedPhone);
  const value = typeof token === "string" ? token.trim() : "";
  const parts = value.split(".");

  if (!secret || parts.length !== 2 || normalized.length !== 10) return false;

  const [encodedPayload, signature] = parts;
  const expectedSignature = signEncodedPayload(encodedPayload, secret);
  if (!safeCompare(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    return (
      payload.normalized === normalized &&
      typeof payload.issuedAt === "number" &&
      typeof payload.expiresAt === "number" &&
      payload.issuedAt <= now &&
      payload.expiresAt > now &&
      payload.expiresAt - payload.issuedAt === PHONE_TOKEN_TTL_MS
    );
  } catch {
    return false;
  }
}

export async function verifyPhoneWithVeriphone(value, options = {}) {
  const normalized = normalizeUsPhone(value);

  if (normalized.length !== 10) {
    return {
      isValid: false,
      normalized,
      reason: "Ingresa un número contactable de 10 dígitos.",
      flags: ["invalid_length"],
      veriphone: null,
    };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      isValid: false,
      normalized,
      reason: "No pudimos verificar el número ahora mismo. Intenta nuevamente.",
      flags: ["veriphone_not_configured"],
      veriphone: null,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? VERIPHONE_TIMEOUT_MS);

  try {
    const response = await (options.fetchImpl || fetch)(
      `https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(`+1${normalized}`)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return {
        isValid: false,
        normalized,
        reason: "No pudimos verificar el número ahora mismo. Intenta nuevamente.",
        flags: ["veriphone_request_failed"],
        veriphone: null,
      };
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      return {
        isValid: false,
        normalized,
        reason: "No pudimos verificar el número ahora mismo. Intenta nuevamente.",
        flags: ["veriphone_request_failed"],
        veriphone: null,
      };
    }

    const flags = [];
    const phoneType = String(data.phone_type || "").trim().toLowerCase();
    const carrier = String(data.carrier || "").trim();
    const countryCode = String(data.country_code || "").trim().toUpperCase();
    const country = String(data.country || "").trim();

    if (data.phone_valid !== true) flags.push("veriphone_invalid_phone");
    if (!allowedPhoneTypes.has(phoneType)) flags.push("veriphone_disallowed_phone_type");
    if (!carrier || carrier.toLowerCase() === "unknown") flags.push("veriphone_unknown_carrier");
    if (countryCode !== "US" && country.toLowerCase() !== "united states") {
      flags.push("veriphone_not_us");
    }

    if (flags.length > 0) {
      return {
        isValid: false,
        normalized,
        reason: "Ingresa un número móvil o fijo contactable.",
        flags,
        veriphone: null,
      };
    }

    return {
      isValid: true,
      normalized,
      flags: [],
      veriphone: {
        normalized,
        phoneValid: true,
        phoneType,
        carrier,
        countryCode,
        country,
        e164: String(data.e164 || `+1${normalized}`),
        phoneRegion: String(data.phone_region || ""),
      },
    };
  } catch {
    return {
      isValid: false,
      normalized,
      reason: "No pudimos verificar el número ahora mismo. Intenta nuevamente.",
      flags: ["veriphone_request_failed"],
      veriphone: null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function validateLeadPhoneVerification({ phone, verificationToken, verification, now }) {
  const normalized = normalizeUsPhone(phone);
  const flags = [];
  const evidence = verification || null;
  const evidenceType = String(evidence?.phoneType || "").trim().toLowerCase();
  const evidenceCarrier = String(evidence?.carrier || "").trim();
  const evidenceCountryCode = String(evidence?.countryCode || "").trim().toUpperCase();
  const evidenceCountry = String(evidence?.country || "").trim().toLowerCase();

  if (normalized.length !== 10) flags.push("invalid_length");
  if (
    !evidence ||
    evidence.phoneValid !== true ||
    !allowedPhoneTypes.has(evidenceType) ||
    !evidenceCarrier ||
    evidenceCarrier.toLowerCase() === "unknown" ||
    (evidenceCountryCode !== "US" && evidenceCountry !== "united states")
  ) {
    flags.push("veriphone_missing_result");
  }
  if (evidence?.normalized !== normalized) flags.push("veriphone_phone_mismatch");
  if (!validatePhoneVerificationToken(verificationToken, normalized, now)) {
    flags.push("veriphone_missing_or_expired_token");
  }

  return {
    isValid: flags.length === 0,
    normalized,
    flags,
    evidence: flags.length === 0 ? evidence : null,
  };
}
