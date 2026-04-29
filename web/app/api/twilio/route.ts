import { NextRequest, NextResponse } from "next/server";
import { isRequestAllowed, getTwilioAuth, twilioLocalUrl } from "@/lib/twilio-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const auth = getTwilioAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = twilioLocalUrl(
    auth.sid,
    country,
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
