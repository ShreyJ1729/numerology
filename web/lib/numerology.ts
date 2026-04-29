export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 2, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2,
  S: 3, T: 4, U: 6, V: 6, W: 6, X: 6, Y: 1, Z: 7,
};

export type LetterPair = { letter: string; value: number };

export function letterBreakdown(name: string): LetterPair[] {
  return Array.from(name.toUpperCase())
    .filter((c) => c in LETTER_VALUES)
    .map((c) => ({ letter: c, value: LETTER_VALUES[c] }));
}

export function reduceToRoot(n: number): number {
  while (n > 9) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

export type NameResult = {
  total: number;
  root: number;
  pairs: LetterPair[];
};

export function nameNumber(name: string): NameResult {
  const pairs = letterBreakdown(name);
  const total = pairs.reduce((s, p) => s + p.value, 0);
  return { total, root: reduceToRoot(total), pairs };
}

export const COUNTRY_DIAL_PREFIX: Record<string, string> = {
  US: "1", CA: "1", GB: "44", IN: "91", AU: "61",
  DE: "49", FR: "33", MX: "52", BR: "55", JP: "81",
};

export const COUNTRY_OPTIONS: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "JP", name: "Japan" },
];

export function mulankFromDob(dob: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  return reduceToRoot(Number(m[3]));
}

export function bhagyankFromDob(dob: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const sum = Array.from(dob.replace(/-/g, "")).reduce((s, d) => s + Number(d), 0);
  return reduceToRoot(sum);
}

export function digitalRoot(digits: string): number {
  let s = Array.from(digits)
    .filter((c) => /\d/.test(c))
    .reduce((a, c) => a + Number(c), 0);
  while (s > 9) {
    s = String(s).split("").reduce((a, d) => a + Number(d), 0);
  }
  return s;
}

export function stripCountryCode(e164: string, country: string): string {
  const prefix = COUNTRY_DIAL_PREFIX[country] ?? "1";
  const bare = e164.replace(/^\+/, "");
  return bare.startsWith(prefix) ? bare.slice(prefix.length) : bare;
}

export function generateAnchors(bn: number, dn: number, length: number): string[] {
  const digits = Array.from(new Set([String(bn), String(dn)])).sort();
  const out: string[] = [];
  const total = digits.length ** length;
  for (let i = 0; i < total; i++) {
    let s = "";
    let x = i;
    for (let j = 0; j < length; j++) {
      s = digits[x % digits.length] + s;
      x = Math.floor(x / digits.length);
    }
    out.push(s);
  }
  return out;
}

export type PhoneScore = {
  bn_dn_count: number;
  bn_dn_pct: number;
  digital_root: number;
  longest_repeat_run: number;
  longest_bn_dn_run: number;
  trailing4: string;
};

export function scoreNumber(domestic: string, bn: number, dn: number): PhoneScore {
  const bnDn = new Set([String(bn), String(dn)]);
  const count = Array.from(domestic).filter((c) => bnDn.has(c)).length;

  let longestRun = 1;
  let maxRun = 1;
  for (let i = 1; i < domestic.length; i++) {
    if (domestic[i] === domestic[i - 1]) {
      maxRun++;
      longestRun = Math.max(longestRun, maxRun);
    } else {
      maxRun = 1;
    }
  }

  let longestBnDnRun = 0;
  let cur = 0;
  for (const c of domestic) {
    if (bnDn.has(c)) {
      cur++;
      longestBnDnRun = Math.max(longestBnDnRun, cur);
    } else {
      cur = 0;
    }
  }

  return {
    bn_dn_count: count,
    bn_dn_pct: Math.round((count / domestic.length) * 1000) / 1000,
    digital_root: digitalRoot(domestic),
    longest_repeat_run: longestRun,
    longest_bn_dn_run: longestBnDnRun,
    trailing4: domestic.slice(-4),
  };
}

export type TwilioNumber = {
  phone_number: string;
  friendly_name: string;
  locality: string;
  region: string;
  iso_country: string;
};

export type Match = TwilioNumber & PhoneScore & { domestic: string };

export function sortMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) =>
    b.bn_dn_pct - a.bn_dn_pct ||
    b.longest_bn_dn_run - a.longest_bn_dn_run ||
    b.longest_repeat_run - a.longest_repeat_run ||
    a.domestic.localeCompare(b.domestic)
  );
}
