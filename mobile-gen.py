"""
Generate US phone numbers ranked by:
1) Percentage of digits matching MULANK target digits (must be >= MIN_PCT) - PRIMARY
2) Digital root of sum equals one of BHAGYANK target digital roots - SECONDARY
"""
import random
from itertools import product

# ---------------------------------------------------------------------------
# CONFIG: change these to target any Mulank (BN) / Bhagyank (DN) combination.
# ---------------------------------------------------------------------------
# MULANK / Birth Number (BN): digits that should appear in the phone number.
MULANK_DIGITS = [3, 8]

# BHAGYANK / Destiny Number (DN): acceptable digital roots of the digit sum.
BHAGYANK_DIGITS = [3, 8]

# Minimum fraction of phone digits that must be in MULANK_DIGITS (criterion 1).
MIN_PCT = 0.5

# How many top results to print.
TOP_N = 30

# Random seed for reproducibility.
SEED = 42

# Sampling tiers for tier-2 candidate generation: (count_of_target_digits, samples)
TIER2_COUNTS = [9, 8, 7, 6, 5]
TIER2_SAMPLES = 2000
# ---------------------------------------------------------------------------

MULANK_SET = set(MULANK_DIGITS)
BHAGYANK_SET = set(BHAGYANK_DIGITS)
NON_MULANK_DIGITS = [d for d in range(10) if d not in MULANK_SET]


def digital_root(n):
    """Keep summing digits until single digit."""
    while n >= 10:
        n = sum(int(d) for d in str(n))
    return n


def analyze(digits):
    """Return (pct_in_mulank, digital_root, sum_total)."""
    total = sum(digits)
    dr = digital_root(total)
    count_match = sum(1 for d in digits if d in MULANK_SET)
    pct = count_match / len(digits)
    return pct, dr, total


def format_phone(digits):
    """Format as (XXX) XXX-XXXX."""
    s = ''.join(str(d) for d in digits)
    return f"({s[0:3]}) {s[3:6]}-{s[6:10]}"


def is_valid_us(digits):
    """Basic NANP validity: area code & exchange can't start with 0 or 1."""
    return digits[0] not in (0, 1) and digits[3] not in (0, 1)


candidates = []
seen = set()

random.seed(SEED)

# Tier 1: every 10-digit combination drawn entirely from MULANK_DIGITS.
if MULANK_DIGITS:
    for combo in product(MULANK_DIGITS, repeat=10):
        digits = list(combo)
        if is_valid_us(digits):
            key = tuple(digits)
            if key not in seen:
                seen.add(key)
                candidates.append(digits)

# Tier 2: mostly MULANK_DIGITS with some non-target fillers.
if MULANK_DIGITS and NON_MULANK_DIGITS:
    for num_target in TIER2_COUNTS:
        if num_target > 10:
            continue
        for _ in range(TIER2_SAMPLES):
            positions_target = random.sample(range(10), num_target)
            digits = [0] * 10
            for p in positions_target:
                digits[p] = random.choice(MULANK_DIGITS)
            for p in range(10):
                if p not in positions_target:
                    digits[p] = random.choice(NON_MULANK_DIGITS)
            if is_valid_us(digits):
                key = tuple(digits)
                if key not in seen:
                    seen.add(key)
                    candidates.append(digits)

# Score & filter
scored = []
for digits in candidates:
    pct, dr, total = analyze(digits)
    if pct < MIN_PCT:
        continue
    meets_dr = 1 if dr in BHAGYANK_SET else 0
    scored.append((pct, meets_dr, dr, total, digits))

# Sort: highest pct first, then meets bhagyank, then prefer in BHAGYANK_SET.
scored.sort(key=lambda x: (-x[0], -x[1], 0 if x[2] in BHAGYANK_SET else 1))

mulank_label = "/".join(str(d) for d in MULANK_DIGITS)
bhagyank_label = "/".join(str(d) for d in BHAGYANK_DIGITS)

print(f"Mulank (BN) target digits: {MULANK_DIGITS}")
print(f"Bhagyank (DN) target roots: {BHAGYANK_DIGITS}")
print(f"Total candidates meeting criterion 1 (>={MIN_PCT*100:.0f}% in {mulank_label}): {len(scored)}\n")

pct_header = f"%{mulank_label}"
crit2_header = f"DR={bhagyank_label}?"
print("=" * 78)
print(f"{'Rank':<5} {'Phone':<18} {pct_header:<10} {'Sum':<6} {'DigRoot':<9} {crit2_header:<10}")
print("=" * 78)

for i, (pct, meets_dr, dr, total, digits) in enumerate(scored[:TOP_N], 1):
    crit2 = "YES" if dr in BHAGYANK_SET else "no"
    print(f"{i:<5} {format_phone(digits):<18} {pct*100:<9.0f}% {total:<6} {dr:<9} {crit2:<10}")
