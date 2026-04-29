# Art of Numerology

Compute Vedic name numbers (*Mulank*, *Bhagyank*) and find available Twilio
phone numbers whose digits resonate with them.

The repo ships in two halves:

- **`/` (Python CLI)** — original scripts for batch searching Twilio inventory
  and exporting ranked CSVs.
- **`web/` (Next.js app)** — production web UI at *Art of Numerology* with the
  same logic ported to TypeScript and a thin Twilio proxy route.

## What it does

In Vedic numerology every digit carries a vibration. Given a date of birth:

- **Mulank** — the digital root of the *day* of birth (1–9).
- **Bhagyank** — the digital root of the *full* date of birth.

Given a name, each letter maps to a value via the Chaldean/Vedic letter chart
in `name_number.py` / `web/lib/numerology.ts`; the values sum and reduce to a
single digit (the *name number*).

Given a `(Mulank, Bhagyank)` pair, the phone search finds Twilio
`AvailablePhoneNumbers` that satisfy:

1. ≥ 50 % of the post-country-code digits are Mulank or Bhagyank.
2. The repeated digital root of those digits equals Mulank or Bhagyank.

Results are sorted by BN/DN density, longest BN/DN run, and longest repeat
run.

## Search strategy

Twilio's `Contains` parameter is a single-digit-wildcard match — no character
classes — so the search enumerates length-`k` patterns drawn from
`{Mulank, Bhagyank}` and issues one `Contains=<pattern>` request per pattern.

A single fixed `k` is too narrow (especially when `Mulank == Bhagyank`, where
`k=5` collapses to one pattern like `55555`). Both the CLI and the web app
search across multiple anchor lengths (default `2,3,4,5`), union the
responses, dedupe by phone number, and apply the post-filter. Twilio caps each
`Contains` query at `PageSize` results regardless of true inventory, and
different lengths empirically sample disjoint slices of inventory — so more
anchors strictly yield more candidates.

`debug_anchors.py` is a one-off harness comparing per-length hit counts and
overlaps for a fixed `(BN, DN)` pair.

## Python CLI

Requires Python 3.10+ and `requests`.

```bash
pip install requests
cp .env.example .env   # then fill in Twilio credentials
```

`.env` keys:

```
TWILIO_ACCOUNT_SID=...
# Either an API key pair (preferred):
TWILIO_API_KEY_SID=...
TWILIO_API_KEY_SECRET=...
# Or a legacy auth token:
TWILIO_AUTH_TOKEN=...
```

Run the phone search:

```bash
./numerology.py --bn 3 --dn 8                       # US, default k=2,3,4,5
./numerology.py --bn 1 --dn 5 --country US -k 3,4   # custom anchor lengths
./numerology.py --bn 3 --dn 8 --area-code 415       # area code filter
```

Output: a sorted CSV at `ranked_phone_numbers.csv` plus a top-10 preview on
stderr.

Compute a name number:

```bash
./name_number.py "Shrey Joshi"
./name_number.py -q "Shrey Joshi"   # just the reduced digit
```

## Web app (`web/`)

Next.js 15 (App Router) + React 19 + Tailwind v4. Two tools on a single page:

- **Name number** — enter a name; see the per-letter breakdown and reduced
  root.
- **Phone numbers** — enter date of birth (or directly enter Mulank/Bhagyank)
  + country, get ranked Twilio matches. The browser drives the anchor
  search and post-filter; the server only proxies Twilio.

### Local development

```bash
cd web
cp .env.local.example .env.local   # fill in Twilio credentials
npm install
npm run dev
```

Open <http://localhost:3000>.

### `/api/twilio` proxy

The route at `web/app/api/twilio/route.ts` is the only server-side surface.
It:

- accepts `?country=&contains=&pageSize=` and forwards to Twilio's
  `AvailablePhoneNumbers/{country}/Local.json`,
- holds Twilio credentials server-side (never sent to the browser),
- rejects cross-origin requests unless the origin appears in
  `ALLOWED_ORIGINS` (comma-separated). Same-origin and localhost are allowed
  by default.

### Deploy

The `web/` directory is set up for Vercel (`vercel.json` declares
`framework: nextjs`). Set the same `TWILIO_*` env vars plus
`ALLOWED_ORIGINS=https://your-domain` in the Vercel project; production
deploys then drive the same UI without a self-hosted backend.

## Repository layout

```
numerology.py          Twilio search CLI — anchor expansion, post-filter, CSV
name_number.py         Vedic letter chart → name number CLI
debug_anchors.py       Per-length anchor hit / overlap diagnostic
ranked_phone_numbers.csv   Sample CLI output

web/
  app/
    page.tsx           Landing page (NameCalculator + PhoneSearch)
    layout.tsx         Fonts, OpenGraph metadata, page chrome
    api/twilio/        Server-side proxy to Twilio
  components/
    NameCalculator.tsx
    PhoneSearch.tsx    Mulank/Bhagyank input + ranked results
    PhoneCard.tsx
    PageMandala.tsx    Background SVG ornament
    Tooltip.tsx
  lib/numerology.ts    TS port of digit-root, anchor, scoring helpers
```

## Credits

By [Shrey Joshi](https://shreyjoshi.com).
