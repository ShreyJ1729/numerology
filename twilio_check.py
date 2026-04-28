"""
Walk ranked_phone_numbers.csv and ask Twilio whether each number is available
for purchase. Stops as soon as the first match is found (configurable).

Auth — supply ONE of these pairs in env vars:
  * TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN     (Account SID auth)
  * TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET (API Key auth; AC SID auto-discovered,
                                                or set TWILIO_ACCOUNT_SID to skip discovery)

How it works
------------
For each phone number we issue:
  GET https://api.twilio.com/2010-04-01/Accounts/{AC}/AvailablePhoneNumbers/US/{Local|TollFree}.json
       ?Contains=<E.164>&SmsEnabled=true&VoiceEnabled=true

If the exact E.164 is returned in `available_phone_numbers`, it is available.
Toll-free area codes (800/833/844/855/866/877/888) hit the TollFree endpoint;
all others hit Local.

Usage
-----
  python3 twilio_check.py                 # scan whole file, stop at first match
  MAX_ROWS=500 python3 twilio_check.py    # cap to first 500 rows
  STOP_ON_MATCH=0 python3 twilio_check.py # don't early-exit, scan everything
"""
import csv
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
from base64 import b64encode
from pathlib import Path


def load_dotenv(path: str = ".env"):
    """Minimal .env loader — KEY=VALUE per line, no quoting tricks."""
    p = Path(path)
    if not p.exists():
        return
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key, val)


load_dotenv()

# ---------------------------------------------------------------------------
INPUT_CSV = os.environ.get("INPUT_CSV", "ranked_phone_numbers.csv")
OUTPUT_CSV = os.environ.get("OUTPUT_CSV", "twilio_availability.csv")
MAX_ROWS = int(os.environ.get("MAX_ROWS", "0")) or None  # 0/unset = all rows
STOP_ON_MATCH = os.environ.get("STOP_ON_MATCH", "1") != "0"
REQUEST_DELAY_SEC = float(os.environ.get("REQUEST_DELAY_SEC", "0.15"))
PROGRESS_EVERY = int(os.environ.get("PROGRESS_EVERY", "25"))
TIMEOUT_SEC = 15
TOLL_FREE_AREA_CODES = {"800", "833", "844", "855", "866", "877", "888"}
# ---------------------------------------------------------------------------


def to_e164(formatted: str) -> str:
    """(833) 833-8333 -> +18338338333"""
    digits = re.sub(r"\D", "", formatted)
    if len(digits) != 10:
        raise ValueError(f"Expected 10 digits, got {digits!r} from {formatted!r}")
    return "+1" + digits


def basic_auth_header(user: str, secret: str) -> str:
    return "Basic " + b64encode(f"{user}:{secret}".encode()).decode()


def http_get_json(url: str, auth: str):
    req = urllib.request.Request(url, headers={
        "Authorization": auth,
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
        return json.loads(resp.read().decode())


def resolve_credentials():
    """Return (account_sid, auth_header_value)."""
    api_key_sid = os.environ.get("TWILIO_API_KEY_SID")
    api_key_secret = os.environ.get("TWILIO_API_KEY_SECRET")
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")

    if api_key_sid and api_key_secret:
        auth = basic_auth_header(api_key_sid, api_key_secret)
        if account_sid:
            return account_sid, auth
        # Discover the account SID via /Accounts.json (API key auth lists its own account).
        try:
            data = http_get_json("https://api.twilio.com/2010-04-01/Accounts.json", auth)
        except urllib.error.HTTPError as e:
            sys.exit(f"ERROR discovering Account SID: HTTP {e.code} {e.read().decode(errors='replace')[:200]}")
        accounts = data.get("accounts", [])
        if not accounts:
            sys.exit("ERROR: API key auth succeeded but no accounts returned.")
        return accounts[0]["sid"], auth

    if account_sid and auth_token:
        return account_sid, basic_auth_header(account_sid, auth_token)

    sys.exit(
        "ERROR: set TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET, "
        "or TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN."
    )


def twilio_search(account_sid: str, auth: str, e164: str):
    """Returns (is_available, raw_matches, error)."""
    area_code = e164[2:5]
    kind = "TollFree" if area_code in TOLL_FREE_AREA_CODES else "Local"
    base = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/AvailablePhoneNumbers/US/{kind}.json"
    qs = urllib.parse.urlencode({
        "Contains": e164,
        "SmsEnabled": "true",
        "VoiceEnabled": "true",
    })
    try:
        data = http_get_json(f"{base}?{qs}", auth)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:200]
        return False, [], f"HTTP {e.code}: {body}"
    except urllib.error.URLError as e:
        return False, [], f"URL error: {e.reason}"

    matches = [item.get("phone_number", "") for item in data.get("available_phone_numbers", [])]
    return (e164 in matches), matches, None


def iter_rows(path, limit):
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            if limit is not None and i > limit:
                return
            yield row


def main():
    account_sid, auth = resolve_credentials()
    print(f"Using Account SID: {account_sid}")
    print(f"Scanning {INPUT_CSV} (limit={MAX_ROWS or 'all'}, stop_on_match={STOP_ON_MATCH})\n")

    results = []
    available = []
    checked = 0
    first_match_rank = None
    started = time.time()

    try:
        for row in iter_rows(INPUT_CSV, MAX_ROWS):
            rank = row.get("Rank", "?")
            phone = row["Phone"]
            e164 = to_e164(phone)
            is_available, matches, err = twilio_search(account_sid, auth, e164)
            checked += 1

            if is_available:
                available.append((rank, phone, e164))
                if first_match_rank is None:
                    first_match_rank = rank
                print(f"  ✓ #{rank:>4}  {phone}  ->  {e164}  AVAILABLE")
            elif err:
                print(f"  ! #{rank:>4}  {phone}  ->  {e164}  ERROR: {err}")
            elif checked % PROGRESS_EVERY == 0:
                elapsed = time.time() - started
                rate = checked / elapsed if elapsed else 0
                print(f"    #{rank:>4}  ...  ({checked} checked, {rate:.1f}/s, {len(available)} found)")

            results.append({
                "Rank": rank,
                "Phone": phone,
                "E164": e164,
                "Twilio_Available": "YES" if is_available else ("ERROR" if err else "no"),
                "Similar_Matches": ";".join(matches),
                "Error": err or "",
            })

            if is_available and STOP_ON_MATCH:
                break

            time.sleep(REQUEST_DELAY_SEC)
    except KeyboardInterrupt:
        print("\nInterrupted; writing partial results…", file=sys.stderr)

    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["Rank", "Phone", "E164", "Twilio_Available", "Similar_Matches", "Error"])
        writer.writeheader()
        writer.writerows(results)

    elapsed = time.time() - started
    print(f"\nChecked {checked} numbers in {elapsed:.1f}s.")
    print(f"Available: {len(available)}")
    if available:
        print("First match: " + " ".join(map(str, available[0])))
    print(f"Wrote {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
