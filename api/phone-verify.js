// Verifica el telefono con Veriphone y emite el token HMAC de un solo flujo.
// Portado de best-life app/api/phone-verify/route.ts (Next -> funcion Vercel).

import {
  createPhoneVerificationToken,
  verifyPhoneWithVeriphone,
} from "../lib/phone-verification.js";
import { isAllowedOrigin, readJsonBody } from "../lib/request-helpers.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAllowedOrigin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const body = await readJsonBody(req);
  const result = await verifyPhoneWithVeriphone(body?.phone);
  const verificationToken = result.isValid
    ? createPhoneVerificationToken(result.normalized)
    : null;
  const ok = result.isValid && !!verificationToken;
  const flags = ok
    ? result.flags
    : verificationToken || !result.isValid
      ? result.flags
      : [...result.flags, "veriphone_not_configured"];
  const status = ok
    ? 200
    : flags.includes("veriphone_not_configured")
      ? 503
      : flags.includes("veriphone_request_failed")
        ? 502
        : 422;

  res.status(status).json({
    ok,
    normalized: result.normalized,
    reason: ok ? null : result.reason || "No pudimos verificar el número ahora mismo.",
    flags,
    veriphone: ok ? result.veriphone : null,
    verificationToken: ok ? verificationToken : null,
  });
}
