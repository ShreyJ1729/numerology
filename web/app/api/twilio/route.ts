import { NextRequest, NextResponse } from "next/server";
import {
  isRequestAllowed,
  getTwilioAuth,
  twilioAvailableUrl,
  type TwilioNumberType,
} from "@/lib/twilio-server";
import { getCountrySpec } from "@/lib/numerology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set<TwilioNumberType>([
  "Local",
  "Mobile",
  "National",
  "TollFree",
]);

export async function GET(req: NextRequest) {
  if (!isRequestAllowed(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "US";
  const contains = searchParams.get("contains");
  const pageSize = searchParams.get("pageSize") || "50";
  const typeRaw = searchParams.get("type");

  if (!contains) {
    return NextResponse.json({ error: "contains parameter is required" }, { status: 400 });
  }

  let type: TwilioNumberType;
  if (typeRaw) {
    if (!ALLOWED_TYPES.has(typeRaw as TwilioNumberType)) {
      return NextResponse.json(
        { error: `type must be one of ${Array.from(ALLOWED_TYPES).join(", ")}` },
        { status: 400 }
      );
    }
    type = typeRaw as TwilioNumberType;
  } else {
    type = getCountrySpec(country)?.numberTypes[0] ?? "Local";
  }

  const auth = getTwilioAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = twilioAvailableUrl(
    auth.sid,
    country,
    type,
    new URLSearchParams({ Contains: contains, PageSize: pageSize })
  );

  try {
    const resp = await fetch(url, {
      headers: { Authorization: auth.authHeader },
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
