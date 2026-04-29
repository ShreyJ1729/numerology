// Numerology phone-number search: combinatorics + scoring module.
//
// A user enters a date of birth which derives two single-digit numbers:
// `bn` (Mulank, 1-9) and `dn` (Bhagyank, 1-9). They may be equal. Twilio's
// AvailablePhoneNumbers `Contains` parameter accepts a digit pattern with
// the wildcard `x` (matches one digit). Min length is 2.
//
// Canonical pattern of length L (2..N) over alphabet {String(bn), String(dn), 'x'}:
//   - s[0] and s[L-1] are anchored (not 'x')
//   - exactly k characters are anchored (the rest are 'x')

export type SearchPattern = {
  q: string; // Twilio Contains query: digits + 'x' wildcards
  k: number; // anchored positions count
  L: number; // pattern length
};

export type ScoredNumber = {
  domestic: string;
  bn_count: number;
  dn_count: number;
  bn_dn_count: number;
  bn_dn_pct: number; // 0..1, rounded to 3 decimals
  digital_root: number; // 1..9
  longest_bn_dn_run: number; // longest run of digits in {bn,dn}
  longest_repeat_run: number; // longest run of same single digit
  trailing4: string;
};

// ---------------------------------------------------------------------------
// Validation helpers

function validateBnDn(bn: number, dn: number): void {
  if (!Number.isInteger(bn) || bn < 1 || bn > 9) {
    throw new Error(`bn must be an integer in [1,9], got ${bn}`);
  }
  if (!Number.isInteger(dn) || dn < 1 || dn > 9) {
    throw new Error(`dn must be an integer in [1,9], got ${dn}`);
  }
}

function validateOpts(numberLength: number, kMin: number): void {
  if (!Number.isInteger(numberLength) || numberLength < 2) {
    throw new Error(`numberLength must be an integer >= 2, got ${numberLength}`);
  }
  if (!Number.isInteger(kMin) || kMin < 2) {
    throw new Error(`kMin must be an integer >= 2, got ${kMin}`);
  }
  if (kMin > numberLength) {
    throw new Error(`kMin (${kMin}) must be <= numberLength (${numberLength})`);
  }
}

// ---------------------------------------------------------------------------
// Combinatorics: nCr and a lex-order combinations generator.

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return Math.round(result);
}

// Yields sorted index subsets of {0..n-1} of size k in lex order.
export function* combinations(n: number, k: number): Generator<number[]> {
  if (k < 0 || k > n) return;
  if (k === 0) {
    yield [];
    return;
  }
  const idx = new Array<number>(k);
  for (let i = 0; i < k; i++) idx[i] = i;
  while (true) {
    yield idx.slice();
    // advance: find rightmost index that can be incremented
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) return;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}

// ---------------------------------------------------------------------------
// Per-tier count and total count.

export function countPatternsAtK(
  bnEqualsDn: boolean,
  k: number,
  N: number
): number {
  if (k < 2 || k > N) return 0;
  const digits = bnEqualsDn ? 1 : 2;
  // |digits|^k * C(N-1, k-1)
  return Math.pow(digits, k) * binomial(N - 1, k - 1);
}

export function countPatterns(
  bn: number,
  dn: number,
  opts?: { kMin?: number; numberLength?: number }
): number {
  validateBnDn(bn, dn);
  const numberLength = opts?.numberLength ?? 10;
  const kMin = opts?.kMin ?? 5;
  validateOpts(numberLength, kMin);
  const bnEqualsDn = bn === dn;
  let total = 0;
  for (let k = numberLength; k >= kMin; k--) {
    total += countPatternsAtK(bnEqualsDn, k, numberLength);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Pattern generation.
//
// `generatePatternsAtK` yields all patterns at a single density tier k.
// `generatePatterns` yields k DESC tier-by-tier (k = N..kMin).

export function* generatePatternsAtK(
  bn: number,
  dn: number,
  k: number,
  numberLength: number
): Generator<SearchPattern> {
  const bnStr = String(bn);
  const dnStr = String(dn);
  // Distinct anchor digits — collapses to one when bn === dn.
  const digits = bn === dn ? [bnStr] : [bnStr, dnStr];

  // Within a fixed k, iterate L ASC (most compact shapes first). Compact
  // patterns are far more productive: a length-5 k=5 pattern like "37373"
  // matches any number containing those 5 digits consecutively (~30 hits per
  // Twilio query), whereas a length-10 k=5 pattern like "3xxx7xx373" pins
  // specific positions and almost always returns zero. We still emit every L
  // for full positional coverage; we just front-load the productive ones.
  for (let L = k; L <= numberLength; L++) {
    const seen = new Set<string>();
    const interiorCount = L - 2;
    const interiorAnchors = k - 2;
    if (interiorAnchors < 0 || interiorAnchors > interiorCount) continue;

    for (const shape of combinations(interiorCount, interiorAnchors)) {
      // anchored position set: 0, shape[i]+1..., L-1
      const anchored: number[] = new Array(k);
      anchored[0] = 0;
      for (let i = 0; i < shape.length; i++) anchored[i + 1] = shape[i] + 1;
      anchored[k - 1] = L - 1;

      // Iterate over digits^k assignments.
      const D = digits.length;
      const total = Math.pow(D, k);
      for (let mask = 0; mask < total; mask++) {
        const chars = new Array<string>(L).fill('x');
        let m = mask;
        for (let i = 0; i < k; i++) {
          chars[anchored[i]] = digits[m % D];
          m = Math.floor(m / D);
        }
        const q = chars.join('');
        if (seen.has(q)) continue;
        seen.add(q);
        yield { q, k, L };
      }
    }
  }
}

export function* generatePatterns(
  bn: number,
  dn: number,
  opts?: { kMin?: number; numberLength?: number }
): Generator<SearchPattern> {
  validateBnDn(bn, dn);
  const numberLength = opts?.numberLength ?? 10;
  const kMin = opts?.kMin ?? 5;
  validateOpts(numberLength, kMin);

  for (let k = numberLength; k >= kMin; k--) {
    yield* generatePatternsAtK(bn, dn, k, numberLength);
  }
}

// ---------------------------------------------------------------------------
// Pattern matching: Twilio-style pattern (digits + 'x' wildcard) substring.

export function matchesPattern(domestic: string, pattern: string): boolean {
  if (pattern.length === 0) return false;
  if (pattern.length > domestic.length) return false;
  // Convert pattern to regex: x or X -> any digit; digits stay literal.
  // Other characters shouldn't appear, but escape defensively.
  const re = new RegExp(
    pattern
      .split('')
      .map((c) => {
        if (c === 'x' || c === 'X') return '\\d';
        if (/[0-9]/.test(c)) return c;
        return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('')
  );
  return re.test(domestic);
}

// ---------------------------------------------------------------------------
// Digital root: repeatedly sum digits until single digit. Returns 1..9 for
// non-zero numbers (and 9 for multiples of 9). For all-zero returns 0, but
// real phone digits won't all be zero in practice.

function digitalRoot(s: string): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i) - 48;
  if (sum === 0) return 0;
  const r = sum % 9;
  return r === 0 ? 9 : r;
}

// ---------------------------------------------------------------------------
// Score a domestic phone number (digits-only string) against bn, dn.

// Cache of compiled regexes per (bn, dn) pair. Only 81 distinct pairs exist,
// so this is bounded; saves O(5) `new RegExp` calls per scoreNumber call on
// the hot path (search route can score thousands per request).
type ScoreRegexes = {
  bnRe: RegExp;
  dnRe: RegExp;
  combinedClassG: RegExp;
  longestRunRe: RegExp;
};
const SCORE_REGEX_CACHE = new Map<number, ScoreRegexes>();
const REPEAT_RUN_RE = /(\d)\1*/g;
const DIGITS_ONLY_RE = /^\d+$/;

function getScoreRegexes(bn: number, dn: number): ScoreRegexes {
  const key = bn * 10 + dn;
  const cached = SCORE_REGEX_CACHE.get(key);
  if (cached) return cached;
  const bnStr = String(bn);
  const dnStr = String(dn);
  const combinedClass = bn === dn ? `[${bnStr}]` : `[${bnStr}${dnStr}]`;
  const compiled: ScoreRegexes = {
    bnRe: new RegExp(bnStr, 'g'),
    dnRe: new RegExp(dnStr, 'g'),
    combinedClassG: new RegExp(combinedClass, 'g'),
    longestRunRe: new RegExp(`${combinedClass}+`, 'g'),
  };
  SCORE_REGEX_CACHE.set(key, compiled);
  return compiled;
}

export function scoreNumber(
  domestic: string,
  bn: number,
  dn: number
): ScoredNumber {
  validateBnDn(bn, dn);
  if (!DIGITS_ONLY_RE.test(domestic)) {
    throw new Error(`domestic must be digits only, got ${JSON.stringify(domestic)}`);
  }

  const { bnRe, dnRe, combinedClassG, longestRunRe } = getScoreRegexes(bn, dn);

  const bn_count = (domestic.match(bnRe) ?? []).length;
  const dn_count = bn === dn ? bn_count : (domestic.match(dnRe) ?? []).length;
  const bn_dn_count = (domestic.match(combinedClassG) ?? []).length;

  const total = domestic.length;
  const pct = total > 0 ? bn_dn_count / total : 0;
  const bn_dn_pct = Math.round(pct * 1000) / 1000;

  const runs = domestic.match(longestRunRe) ?? [];
  let longest_bn_dn_run = 0;
  for (const r of runs) if (r.length > longest_bn_dn_run) longest_bn_dn_run = r.length;

  const repeatRuns = domestic.match(REPEAT_RUN_RE) ?? [];
  let longest_repeat_run = 0;
  for (const r of repeatRuns) if (r.length > longest_repeat_run) longest_repeat_run = r.length;

  return {
    domestic,
    bn_count,
    dn_count,
    bn_dn_count,
    bn_dn_pct,
    digital_root: digitalRoot(domestic),
    longest_bn_dn_run,
    longest_repeat_run,
    trailing4: domestic.slice(-4),
  };
}
