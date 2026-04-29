import type { NextRequest } from "next/server";

export function isRequestAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const secFetchSite = req.headers.get("sec-fetch-site");

  if (!origin) {
    return secFetchSite === null || secFetchSite === "same-origin" || secFetchSite === "none";
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    if (host && new URL(origin).host === host) return true;
  } catch {}

  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

export type TwilioAuthOk = { ok: true; sid: string; authHeader: string };
export type TwilioAuthErr = { ok: false; error: string; status: number };
export type TwilioAuthResult = TwilioAuthOk | TwilioAuthErr;

export function getTwilioAuth(): TwilioAuthResult {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  if (!sid) {
    return {
      ok: false,
      error: "TWILIO_ACCOUNT_SID missing on server. Set it in .env.local",
      status: 500,
    };
  }
  const keySid = process.env.TWILIO_API_KEY_SID;
  const keySecret = process.env.TWILIO_API_KEY_SECRET;
  const token = process.env.TWILIO_AUTH_TOKEN;

  let user: string;
  let pass: string;
  if (keySid && keySecret) {
    user = keySid;
    pass = keySecret;
  } else if (token) {
    user = sid;
    pass = token;
  } else {
    return {
      ok: false,
      error: "Need TWILIO_API_KEY_SID+SECRET or TWILIO_AUTH_TOKEN",
      status: 500,
    };
  }
  const authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  return { ok: true, sid, authHeader };
}

export const TWILIO_API_BASE = "https://api.twilio.com";

// Twilio AvailablePhoneNumbers resource type. Local for US/CA, Mobile/National
// for most international countries.
export type TwilioNumberType = "Local" | "Mobile" | "National" | "TollFree";

export function twilioAvailableUrl(
  sid: string,
  country: string,
  type: TwilioNumberType,
  params: URLSearchParams
): string {
  return `${TWILIO_API_BASE}/2010-04-01/Accounts/${sid}/AvailablePhoneNumbers/${country}/${type}.json?${params.toString()}`;
}

export function twilioLocalUrl(
  sid: string,
  country: string,
  params: URLSearchParams
): string {
  return twilioAvailableUrl(sid, country, "Local", params);
}
