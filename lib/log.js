// Logging estructurado para los Runtime Logs de Vercel.
// Cada linea es un JSON con { level, event, ts, ...data } — filtrable en el
// dashboard de Vercel (Logs) buscando por "event":"..." o por level.

export function logEvent(level, event, data) {
  const entry = {
    level,
    event,
    ts: new Date().toISOString(),
    ...(data || {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logInfo = (event, data) => logEvent("info", event, data);
export const logWarn = (event, data) => logEvent("warn", event, data);
export const logError = (event, data) => logEvent("error", event, data);

// PII enmascarada: suficiente para correlacionar sin exponer el dato completo.
export function maskPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? `***${digits.slice(-4)}` : "";
}

export function maskEmail(value) {
  const email = String(value || "");
  const at = email.indexOf("@");
  return at > 0 ? `${email[0]}***${email.slice(at)}` : "";
}
