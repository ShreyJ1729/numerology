import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRequestAllowed(req: NextRequest): boolean {
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

export async function GET(req: NextRequest) {
  if (!isRequestAllowed(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "US";
  const contains = searchParams.get("contains");
  const pageSize = searchParams.get("pageSize") || "50";

  if (!contains) {
    return NextResponse.json({ error: "contains parameter is required" }, { status: 400 });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const keySid = process.env.TWILIO_API_KEY_SID;
  const keySecret = process.env.TWILIO_API_KEY_SECRET;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid) {
    return NextResponse.json(
      { error: "TWILIO_ACCOUNT_SID missing on server. Set it in .env.local" },
      { status: 500 }
    );
  }

  let user: string;
  let pass: string;
  if (keySid && keySecret) {
    user = keySid;
    pass = keySecret;
  } else if (token) {
    user = sid;
    pass = token;
  } else {
    return NextResponse.json(
      { error: "Need TWILIO_API_KEY_SID+SECRET or TWILIO_AUTH_TOKEN" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({ Contains: contains, PageSize: pageSize });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/AvailablePhoneNumbers/${country}/Local.json?${params.toString()}`;
  const auth = Buffer.from(`${user}:${pass}`).toString("base64");

  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!resp.ok) {
      const body = await resp.text();
      return NextResponse.json(
        { error: `Twilio HTTP ${resp.status}`, body: body.slice(0, 400) },
        { status: resp.status }
      );
    }
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
