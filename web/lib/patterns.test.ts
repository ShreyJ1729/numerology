// Self-test for lib/patterns.ts. Runnable via:
//   npx --yes tsx@latest lib/patterns.test.ts
// or fall back to esbuild bundle + node.

import {
  countPatterns,
  countPatternsAtK,
  generatePatterns,
  matchesPattern,
  scoreNumber,
  type SearchPattern,
} from './patterns';

let failures = 0;
function assert(cond: any, msg: string): void {
  if (!cond) {
    failures++;
    console.error('FAIL:', msg);
  } else {
    console.log('ok   ', msg);
  }
}
function assertEq<T>(actual: T, expected: T, msg: string): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(
      `FAIL: ${msg}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`
    );
  } else {
    console.log('ok   ', msg);
  }
}

// -- countPatternsAtK ---------------------------------------------------------
assertEq(countPatternsAtK(false, 10, 10), 1024, 'countPatternsAtK(false,10,10)===1024');
assertEq(countPatternsAtK(false, 9, 10), 4608, 'countPatternsAtK(false,9,10)===4608');
assertEq(countPatternsAtK(false, 8, 10), 9216, 'countPatternsAtK(false,8,10)===9216');
assertEq(countPatternsAtK(false, 5, 10), 4032, 'countPatternsAtK(false,5,10)===4032');
assertEq(countPatternsAtK(true, 5, 10), 126, 'countPatternsAtK(true,5,10)===126');

// -- countPatterns ------------------------------------------------------------
assertEq(countPatterns(3, 7), 37696, 'countPatterns(3,7) === 37696');
assertEq(
  countPatterns(3, 7),
  1024 + 4608 + 9216 + 10752 + 8064 + 4032,
  'countPatterns(3,7) decomposes correctly'
);
assertEq(countPatterns(3, 3), 382, 'countPatterns(3,3) === 382');
assertEq(
  countPatterns(3, 3),
  1 + 9 + 36 + 84 + 126 + 126,
  'countPatterns(3,3) decomposes correctly'
);

// -- generatePatterns: k=10, L=10 tier ----------------------------------------
{
  const all: SearchPattern[] = [];
  for (const p of generatePatterns(3, 7, { kMin: 10, numberLength: 10 })) {
    all.push(p);
  }
  assertEq(all.length, 1024, 'k=10,L=10 tier yields exactly 1024 patterns');
  const allFullLen = all.every((p) => p.q.length === 10);
  assert(allFullLen, 'All k=10 patterns have length 10');
  const noWild = all.every((p) => !p.q.includes('x'));
  assert(noWild, 'No wildcards in k=10 patterns');
  const onlyDigits = all.every((p) => /^[37]+$/.test(p.q));
  assert(onlyDigits, 'k=10 patterns composed only of {3,7}');
  const unique = new Set(all.map((p) => p.q));
  assertEq(unique.size, 1024, 'k=10 patterns are unique');
}

// -- generatePatterns: full sweep, ordering -----------------------------------
{
  const gen = generatePatterns(3, 7);
  const first = gen.next().value as SearchPattern;
  assert(first && first.k === 10, 'First yielded pattern has highest k=10');
}

// -- generatePatterns: total count matches countPatterns ----------------------
{
  let count = 0;
  for (const _p of generatePatterns(3, 7)) count++;
  assertEq(count, 37696, 'generatePatterns(3,7) yields countPatterns(3,7) items');
}

// -- generatePatterns: bn==dn collapse ----------------------------------------
{
  let count = 0;
  for (const _p of generatePatterns(3, 3)) count++;
  assertEq(count, 382, 'generatePatterns(3,3) yields countPatterns(3,3) items (collapsed)');
}

// -- generatePatterns: deterministic ordering ---------------------------------
{
  const a: string[] = [];
  const b: string[] = [];
  let i = 0;
  for (const p of generatePatterns(3, 7)) {
    if (i++ >= 50) break;
    a.push(p.q);
  }
  i = 0;
  for (const p of generatePatterns(3, 7)) {
    if (i++ >= 50) break;
    b.push(p.q);
  }
  assertEq(a, b, 'generatePatterns is deterministic');
}

// -- generatePatterns: ordering invariants (k DESC, L ASC within k) ----------
// L ASC is intentional: compact patterns like "37373" are far more productive
// against Twilio inventory than wide ones like "3xxx7xx373". We want them
// emitted first so workers hit hits early.
{
  let prevK = Infinity;
  let prevL = -Infinity;
  let i = 0;
  let okOrder = true;
  for (const p of generatePatterns(3, 7)) {
    if (p.k > prevK) { okOrder = false; break; }
    if (p.k === prevK) {
      if (p.L < prevL) { okOrder = false; break; }
    } else {
      prevL = -Infinity;
    }
    prevK = p.k;
    prevL = p.L;
    if (i++ >= 5000) break;
  }
  assert(okOrder, 'Patterns yielded by k DESC then L ASC within k');
}

// -- scoreNumber --------------------------------------------------------------
{
  const s = scoreNumber('3737373737', 3, 7);
  assertEq(s.bn_count, 5, 'scoreNumber("3737373737",3,7) bn_count=5');
  assertEq(s.dn_count, 5, 'scoreNumber("3737373737",3,7) dn_count=5');
  assertEq(s.bn_dn_count, 10, 'scoreNumber("3737373737",3,7) bn_dn_count=10');
  assertEq(s.bn_dn_pct, 1, 'scoreNumber("3737373737",3,7) bn_dn_pct=1');
  // Note: spec stated digital_root=1, but 3+7+3+7+3+7+3+7+3+7 = 50 -> 5+0 = 5.
  // The mathematically correct iterated digital root is 5; matches the existing
  // project convention in lib/numerology.ts. Asserting the correct value.
  assertEq(s.digital_root, 5, 'scoreNumber("3737373737",3,7) digital_root=5 (sum=50, 50->5)');
  assertEq(s.longest_bn_dn_run, 10, 'scoreNumber("3737373737",3,7) longest_bn_dn_run=10');
  assertEq(s.longest_repeat_run, 1, 'scoreNumber("3737373737",3,7) longest_repeat_run=1');
}
{
  const s = scoreNumber('3700000000', 3, 7);
  assertEq(s.bn_dn_count, 2, 'scoreNumber("3700000000",3,7) bn_dn_count=2');
  assertEq(s.bn_dn_pct, 0.2, 'scoreNumber("3700000000",3,7) bn_dn_pct=0.2');
  assertEq(s.longest_bn_dn_run, 2, 'scoreNumber("3700000000",3,7) longest_bn_dn_run=2');
  assertEq(s.longest_repeat_run, 8, 'scoreNumber("3700000000",3,7) longest_repeat_run=8');
}

// -- matchesPattern -----------------------------------------------------------
assertEq(matchesPattern('3737373737', '3x3x3x3x3'), true, 'matches "3x3x3x3x3" in 3737373737');
assertEq(matchesPattern('3737373737', '3x3x3x3x3x3'), false, 'pattern length 11 does not fit');
assertEq(matchesPattern('1234567890', '37'), false, '"37" not contained in 1234567890');
assertEq(matchesPattern('0303030303', '3x3'), true, '"3x3" found in 0303030303');
assertEq(matchesPattern('1234567890', 'xx'), true, '"xx" matches any 2 digits');
assertEq(matchesPattern('1234567890', '12'), true, '"12" prefix match');
assertEq(matchesPattern('1234567890', '90'), true, '"90" suffix match');

// -- Round-trip: 3 random patterns from generator, fill x with 0, match -------
{
  const all: SearchPattern[] = [];
  for (const p of generatePatterns(3, 7)) {
    all.push(p);
    if (all.length > 5000) break;
  }
  // pseudo-random deterministic picks
  const picks = [all[0], all[Math.floor(all.length / 2)], all[all.length - 1]];
  for (const p of picks) {
    // Fill wildcards with 0 to construct a number that should contain p
    const filled = p.q.replace(/x/g, '0');
    // Pad to length 10 if shorter so domestic matches a realistic length
    const domestic = filled.padEnd(10, '0');
    const ok = matchesPattern(domestic, p.q);
    assert(ok, `round-trip: pattern "${p.q}" matches filled "${domestic}"`);
  }
}

// -- combinations sanity ------------------------------------------------------
{
  // import here to avoid altering top imports unnecessarily
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { combinations } = require('./patterns') as typeof import('./patterns');
  const got: number[][] = [];
  for (const c of combinations(4, 2)) got.push(c);
  assertEq(
    got,
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ],
    'combinations(4,2) lex order'
  );
  const empty: number[][] = [];
  for (const c of combinations(3, 0)) empty.push(c);
  assertEq(empty, [[]], 'combinations(3,0) === [[]]');
}

// -- Validation throws --------------------------------------------------------
{
  let threw = false;
  try { countPatterns(0 as any, 3); } catch { threw = true; }
  assert(threw, 'countPatterns rejects bn=0');

  threw = false;
  try { countPatterns(3, 10 as any); } catch { threw = true; }
  assert(threw, 'countPatterns rejects dn=10');

  threw = false;
  try { countPatterns(3, 7, { kMin: 1 }); } catch { threw = true; }
  assert(threw, 'countPatterns rejects kMin<2');

  threw = false;
  try { countPatterns(3, 7, { numberLength: 1 }); } catch { threw = true; }
  assert(threw, 'countPatterns rejects numberLength<2');

  threw = false;
  try { countPatterns(3, 7, { kMin: 11, numberLength: 10 }); } catch { threw = true; }
  assert(threw, 'countPatterns rejects kMin>numberLength');
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED.`);
  process.exit(1);
} else {
  console.log('\nAll assertions passed.');
}
