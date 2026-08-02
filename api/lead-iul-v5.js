// Guarda el lead del funnel /iul-v5 en Supabase (leads + lead_metadata) con
// lead_status ready_for_sell. Portado del backend de best-life /api/lead-iul-v4
// con el patron de metadata no-bloqueante de seguro-de-vida-online.

import { waitUntil } from "@vercel/functions";
import { buildApplicationNumber } from "../lib/application-number.js";
import { logError, logInfo, logWarn, maskEmail, maskPhone } from "../lib/log.js";
import { validateLeadPhoneVerification } from "../lib/phone-verification.js";
import {
  getGeolocation,
  getRequestCookie,
  getRequestIp,
  isAllowedOrigin,
  readJsonBody,
} from "../lib/request-helpers.js";
import { createSupabaseAdminClient } from "../lib/supabase-admin.js";

const leadTokenCookieName = "bf_lead_token";
const PHONE_WINDOW_MS = 6 * 60 * 60 * 1000;
const VELOCITY_WINDOW_MS = 30 * 60 * 1000;
const CLEANUP_EVERY_SUBMISSIONS = 100;
const MAX_TRACKED_KEYS_PER_STORE = 50000;
const deviceCookieName = "bf_iul_device_id";
const phoneAttempts = new Map();
const ipAttempts = new Map();
const deviceAttempts = new Map();
let submissionsSinceCleanup = 0;
const stateAbbreviations = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

function hasValidLeadToken(req) {
  const headerValue = req.headers["x-lead-token"];
  const headerToken = String(Array.isArray(headerValue) ? headerValue[0] : headerValue || "").trim();
  const cookieToken = getRequestCookie(req, leadTokenCookieName).trim();

  return !!headerToken && !!cookieToken && headerToken === cookieToken;
}

function pruneAndCount(store, key, windowMs, now) {
  const recent = (store.get(key) || []).filter((timestamp) => now - timestamp <= windowMs);
  recent.push(now);
  store.set(key, recent);
  return recent.length;
}

function pruneStore(store, windowMs, now) {
  for (const [key, timestamps] of store) {
    const recent = timestamps.filter((timestamp) => now - timestamp <= windowMs);

    if (recent.length === 0) {
      store.delete(key);
    } else {
      store.set(key, recent);
    }
  }

  if (store.size <= MAX_TRACKED_KEYS_PER_STORE) return;

  const oldestFirst = [...store.entries()]
    .map(([key, timestamps]) => ({
      key,
      latest: Math.max(...timestamps),
    }))
    .sort((a, b) => a.latest - b.latest);
  const keysToDelete = store.size - MAX_TRACKED_KEYS_PER_STORE;

  for (let index = 0; index < keysToDelete; index += 1) {
    store.delete(oldestFirst[index].key);
  }
}

function maybePruneAttemptStores(now) {
  submissionsSinceCleanup += 1;

  if (submissionsSinceCleanup < CLEANUP_EVERY_SUBMISSIONS) return;

  submissionsSinceCleanup = 0;
  pruneStore(phoneAttempts, PHONE_WINDOW_MS, now);
  pruneStore(ipAttempts, VELOCITY_WINDOW_MS, now);
  pruneStore(deviceAttempts, VELOCITY_WINDOW_MS, now);
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeState(value) {
  const state = normalizeString(value);
  if (/^[A-Za-z]{2}$/.test(state)) return state.toUpperCase();
  return stateAbbreviations[state] || "";
}

function normalizeZipCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 5);
}

function getFunnelId(page) {
  const normalizedPage = normalizeString(page).replace(/^\/+/, "");
  return normalizedPage || "home";
}

function getLeadLanguage() {
  const value = process.env.NEXT_PUBLIC_LEAD_LANGUAGE?.trim().toLowerCase();
  return value === "en" || value === "es" ? value : null;
}

function getLeadSource() {
  const value = process.env.NEXT_PUBLIC_LEAD_SOURCE?.trim().toLowerCase();
  return value === "network" || value === "internal" ? value : null;
}

function getLeadDomain() {
  const value = process.env.NEXT_PUBLIC_LEAD_DOMAIN?.trim().toLowerCase();
  return value || null;
}

function isTrustedFormCertUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "cert.trustedform.com";
  } catch {
    return false;
  }
}

async function claimTrustedFormCertificate({ certUrl, email, phone, leadId }) {
  const apiKey = process.env.TRUSTEDFORM_API_KEY?.trim();

  if (!certUrl || !isTrustedFormCertUrl(certUrl)) {
    return { status: "skipped", error: "Missing or invalid TrustedForm certificate URL" };
  }

  if (!apiKey || apiKey === "your-trustedform-api-key-here") {
    return { status: "skipped", error: "TrustedForm API key is not configured" };
  }

  const response = await fetch(certUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`API:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/json",
      "api-version": "4.0",
    },
    body: JSON.stringify({
      retain: {
        reference: leadId,
        vendor: process.env.TRUSTEDFORM_VENDOR?.trim() || "Best Life",
      },
      match_lead: {
        email,
        phone,
      },
    }),
    cache: "no-store",
  });

  const responseBody = await response.json().catch(async () => response.text().catch(() => null));

  if (!response.ok) {
    return {
      status: "failed",
      response: responseBody,
      error: `TrustedForm claim failed with ${response.status}`,
    };
  }

  return {
    status: "claimed",
    response: responseBody,
  };
}

async function claimTrustedFormAndUpdateLead({ supabase, metadataTableName, leadId, certUrl, email, phone }) {
  if (!supabase) return;

  try {
    const claimResult = await claimTrustedFormCertificate({ certUrl, email, phone, leadId });

    const { error } = await supabase
      .from(metadataTableName)
      .update({
        trustedform_claim_status: claimResult.status,
        trustedform_claimed_at: claimResult.status === "claimed" ? new Date().toISOString() : null,
        trustedform_claim_response: claimResult.response ?? null,
        trustedform_claim_error: claimResult.error ?? null,
      })
      .eq("lead_id", leadId);

    if (error) {
      logError("trustedform_status_update_failed", {
        lead_id: leadId,
        reason: error.message || String(error),
      });
    }
  } catch (error) {
    logError("trustedform_claim_failed", {
      lead_id: leadId,
      reason: error instanceof Error ? error.message : String(error),
    });

    await supabase
      .from(metadataTableName)
      .update({
        trustedform_claim_status: "failed",
        trustedform_claim_error: error instanceof Error ? error.message : "TrustedForm claim failed",
      })
      .eq("lead_id", leadId);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const startedAt = Date.now();

  if (!isAllowedOrigin(req) || !hasValidLeadToken(req)) {
    logWarn("lead_rejected", {
      reason: !isAllowedOrigin(req) ? "forbidden_origin" : "forbidden_lead_token",
      ip: getRequestIp(req) || "unknown",
    });
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const body = await readJsonBody(req);

  if (!body?.answers) {
    logWarn("lead_rejected", { reason: "invalid_payload", ip: getRequestIp(req) || "unknown" });
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    logError("lead_failed", { reason: "supabase_not_configured" });
    res.status(500).json({ error: "Supabase server credentials are not configured" });
    return;
  }

  const geo = getGeolocation(req);
  const requestIp = getRequestIp(req) || "unknown";
  const phoneValidation = validateLeadPhoneVerification({
    phone: body.answers.phoneNumber,
    verificationToken: body.meta?.phoneVerificationToken,
    verification: body.meta?.phoneVerification,
  });
  const deviceId = String(body.meta?.deviceId || getRequestCookie(req, deviceCookieName)).trim();
  const trustedFormCertUrl = normalizeString(body.meta?.trustedFormCertUrl);
  const adaccountName = normalizeString(body.meta?.adaccountName);
  const leadUrl = normalizeString(body.meta?.leadUrl);
  const userAgent = normalizeString(req.headers["user-agent"]);
  const now = Date.now();
  maybePruneAttemptStores(now);
  const duplicatePhoneCount = phoneValidation.normalized
    ? pruneAndCount(phoneAttempts, phoneValidation.normalized, PHONE_WINDOW_MS, now)
    : 0;
  const ipVelocityCount = requestIp !== "unknown"
    ? pruneAndCount(ipAttempts, requestIp, VELOCITY_WINDOW_MS, now)
    : 0;
  const deviceVelocityCount = deviceId
    ? pruneAndCount(deviceAttempts, deviceId, VELOCITY_WINDOW_MS, now)
    : 0;
  const cleanedAnswers = Object.fromEntries(
    Object.entries(body.answers).filter(([, value]) => value !== "" && value != null)
  );
  const riskFlags = [
    ...phoneValidation.flags,
    ...(duplicatePhoneCount >= 3 ? ["duplicate_phone"] : []),
    ...(ipVelocityCount >= 6 ? ["high_velocity_ip"] : []),
    ...(deviceVelocityCount >= 4 ? ["high_velocity_device"] : []),
  ];

  if (!phoneValidation.isValid) {
    logWarn("lead_rejected", {
      reason: "phone_verification_invalid",
      phone: maskPhone(phoneValidation.normalized),
      ip: requestIp,
      device_id: deviceId || undefined,
      risk_flags: riskFlags,
    });
    res.status(422).json({
      error: "No pudimos confirmar la verificación del teléfono.",
      riskFlags,
    });
    return;
  }

  const restAnswers = Object.fromEntries(
    Object.entries(cleanedAnswers).filter(([key]) => key !== "phoneNumber")
  );
  const submittedAt = new Date().toISOString();
  const funnelId = getFunnelId(body.page);
  const state = normalizeState(restAnswers.state);
  const zipCode = normalizeZipCode(restAnswers.zipCode);
  const salePath = body.meta?.salePath === "call" ? "call" : "lead";
  const leadStatus = salePath === "call" ? "pending_call" : "ready_for_sell";
  const leadLanguage = getLeadLanguage();
  const leadSource = getLeadSource();
  const leadDomain = getLeadDomain();
  const sub1 = normalizeString(restAnswers.sub1);
  const sub2 = normalizeString(restAnswers.sub2);
  const lead = {
    submittedAt,
    source: "life-insurances-html-iul-v5",
    pagina: body.page || "home",
    funnelId,
    language: leadLanguage,
    leadSource,
    domain: leadDomain,
    sub1,
    sub2,
    adaccountName: adaccountName || null,
    ipAddress: requestIp,
    userAgent: userAgent || null,
    geolocation: geo,
    trustedFormCertUrl,
    salePath,
    leadStatus,
    ...restAnswers,
    state,
    zipCode,
    phoneNumber: phoneValidation.normalized,
    validation: {
      phoneCountry: "US",
      phoneProvider: "veriphone",
      phoneType: phoneValidation.evidence?.phoneType,
      phoneCarrier: phoneValidation.evidence?.carrier,
      phoneRegion: phoneValidation.evidence?.phoneRegion,
      duplicatePhoneCount,
      ipVelocityCount,
      deviceVelocityCount,
      flags: riskFlags,
    },
  };
  const tableName = process.env.SUPABASE_LEADS_TABLE?.trim() || "leads";
  const metadataTableName = process.env.SUPABASE_LEAD_METADATA_TABLE?.trim() || "lead_metadata";
  const { data, error } = await supabase
    .from(tableName)
    .insert({
      funnel_id: funnelId,
      age_group: normalizeString(restAnswers.ageGroup),
      insurance_goal: normalizeString(restAnswers.insuranceGoal),
      state,
      zip_code: zipCode,
      first_name: normalizeString(restAnswers.firstName),
      last_name: normalizeString(restAnswers.lastName),
      phone_number: phoneValidation.normalized,
      email: normalizeString(restAnswers.email),
      lead_status: leadStatus,
      trustedform_cert_url: trustedFormCertUrl || null,
      language: leadLanguage,
      source: leadSource,
      domain: leadDomain,
      sub1: sub1 || null,
      sub2: sub2 || null,
    })
    .select("lead_id")
    .single();

  if (error) {
    logError("lead_insert_failed", {
      reason: error.message || String(error),
      code: error.code || undefined,
      funnel_id: funnelId,
      phone: maskPhone(phoneValidation.normalized),
      email: maskEmail(restAnswers.email),
      state,
      zip_code: zipCode,
      risk_flags: riskFlags,
      duration_ms: Date.now() - startedAt,
    });
    res.status(502).json({ error: "No pudimos guardar el lead en Supabase" });
    return;
  }

  logInfo("lead_saved", {
    lead_id: data.lead_id,
    funnel_id: funnelId,
    sale_path: salePath,
    lead_status: leadStatus,
    state,
    zip_code: zipCode,
    phone: maskPhone(phoneValidation.normalized),
    email: maskEmail(restAnswers.email),
    sub1: sub1 || undefined,
    risk_flags: riskFlags,
    duplicate_phone_count: duplicatePhoneCount,
    ip_velocity_count: ipVelocityCount,
    device_velocity_count: deviceVelocityCount,
    trustedform_present: !!trustedFormCertUrl,
    duration_ms: Date.now() - startedAt,
  });

  const metadataRow = {
    lead_id: data.lead_id,
    application_id: buildApplicationNumber(data.lead_id),
    source: lead.source,
    page: lead.pagina,
    submitted_at: submittedAt,
    ip_address: requestIp,
    geolocation: geo,
    device_id: deviceId || null,
    validation: lead.validation,
    risk_flags: riskFlags,
    adaccount_name: adaccountName || null,
    lead_url: leadUrl || null,
    payload: lead,
  };

  // El lead YA quedo guardado: respondemos exito de inmediato. La metadata es
  // complementaria y se escribe por detras con reintentos; si falla, se
  // registra y se descarta -- NO bloquea ni duplica leads.
  waitUntil(
    (async () => {
      const METADATA_MAX_ATTEMPTS = 3;
      let metadataSaved = false;

      for (let attempt = 1; attempt <= METADATA_MAX_ATTEMPTS; attempt += 1) {
        const { error: metadataError } = await supabase
          .from(metadataTableName)
          .insert(metadataRow);

        if (!metadataError) {
          metadataSaved = true;
          break;
        }

        logError("lead_metadata_insert_failed", {
          lead_id: data.lead_id,
          attempt,
          max_attempts: METADATA_MAX_ATTEMPTS,
          reason: metadataError.message || String(metadataError),
        });

        if (attempt < METADATA_MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        }
      }

      if (!metadataSaved) {
        logError("lead_metadata_discarded", {
          lead_id: data.lead_id,
          note: "el lead SI se guardo; solo se perdio la metadata complementaria",
        });
      } else {
        logInfo("lead_metadata_saved", { lead_id: data.lead_id });
      }

      if (data?.lead_id && trustedFormCertUrl) {
        await claimTrustedFormAndUpdateLead({
          supabase,
          metadataTableName,
          leadId: data.lead_id,
          certUrl: trustedFormCertUrl,
          email: normalizeString(restAnswers.email),
          phone: phoneValidation.normalized,
        });
      }
    })(),
  );

  res.setHeader(
    "Set-Cookie",
    `${leadTokenCookieName}=; Max-Age=0; Path=/; SameSite=Strict; HttpOnly`,
  );
  res.status(200).json({
    ok: true,
    saved: true,
    leadId: data?.lead_id ?? null,
  });
}
