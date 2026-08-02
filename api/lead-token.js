import { randomUUID } from "node:crypto";

export const leadTokenCookieName = "bf_lead_token";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = randomUUID();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  res.setHeader(
    "Set-Cookie",
    `${leadTokenCookieName}=${token}; Max-Age=${30 * 60}; Path=/; SameSite=Strict; HttpOnly${secure}`,
  );
  res.status(200).json({ token });
}
