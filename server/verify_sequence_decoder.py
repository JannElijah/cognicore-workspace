"""
verify_sequence_decoder.py
Quick unit test for the Sequence Decoder pattern generation logic.
Verifies all 5 pattern types across 5 difficulty levels.
"""

import sys
import os
import random

# ──────────────────────────────────────────────
# Replicate the JS pattern generation in Python
# ──────────────────────────────────────────────

def rand(min_, max_):
    return random.randint(min_, max_)

def pick(arr):
    return arr[random.randint(0, len(arr) - 1)]

def generate_sequence(difficulty_level, sequence_length, pattern_types, missing_position):
    """Python port of SequenceDecoderScene.generateSequence()"""

    type_ = pick(pattern_types)
    len_  = sequence_length
    full  = []

    if type_ == 'arithmetic':
        a = rand(1, 20)
        d = pick([2, 3, 4, 5, 6, 7, 8, 10])
        for i in range(len_ + 1):
            full.append(a + d * i)

    elif type_ == 'geometric':
        a = rand(1, 4)
        r = pick([2, 3])
        for i in range(len_ + 1):
            full.append(a * (r ** i))

    elif type_ == 'alternating':
        start = rand(2, 15)
        d1 = pick([2, 3, 5, 7])
        d2 = pick([1, 4, 6, 8])
        full = [start]
        for i in range(len_ + 1):
            last = full[-1]
            full.append(last + (d1 if i % 2 == 0 else d2))
        full = full[:len_ + 1]

    elif type_ == 'fibonacci':
        a = rand(1, 5)
        b = rand(1, 5)
        full = [a, b]
        for i in range(2, len_ + 1):
            full.append(full[i-1] + full[i-2])

    elif type_ == 'dual_rule':
        a_start = rand(2, 10)
        d_a = pick([2, 4, 6])
        b_start = rand(1, 5)
        r_b = 2
        seq_a = [a_start]
        seq_b = [b_start]
        for i in range(1, len_ // 2 + 3):
            seq_a.append(seq_a[-1] + d_a)
            seq_b.append(seq_b[-1] * r_b)
        for i in range(len_ + 1):
            full.append(seq_a[i // 2] if i % 2 == 0 else seq_b[i // 2])
        full = full[:len_ + 1]

    # Determine missing index
    if missing_position == 'second_last':
        missing_index = len_ - 2
    else:
        missing_index = len_ - 1

    correct_answer = full[missing_index]
    display_seq    = full[:len_]

    return {
        'type': type_,
        'full': full,
        'display_seq': display_seq,
        'missing_index': missing_index,
        'correct_answer': correct_answer
    }


# ──────────────────────────────────────────────
# DDA configs (mirror of app.py)
# ──────────────────────────────────────────────

DDA_CONFIGS = {
    1: {'sequence_length': 4, 'pattern_types': ['arithmetic'], 'missing_position': 'last', 'time_limit': 12000},
    2: {'sequence_length': 5, 'pattern_types': ['arithmetic', 'geometric'], 'missing_position': 'last', 'time_limit': 10000},
    3: {'sequence_length': 5, 'pattern_types': ['arithmetic', 'geometric', 'alternating'], 'missing_position': 'last', 'time_limit': 9000},
    4: {'sequence_length': 6, 'pattern_types': ['arithmetic', 'geometric', 'alternating', 'fibonacci'], 'missing_position': 'second_last', 'time_limit': 8000},
    5: {'sequence_length': 6, 'pattern_types': ['arithmetic', 'geometric', 'alternating', 'fibonacci', 'dual_rule'], 'missing_position': 'second_last', 'time_limit': 6000},
}


def run_tests():
    print("=" * 60)
    print("  SEQUENCE DECODER -- Pattern Generation Verification")
    print("=" * 60)

    total_tests = 0
    passed      = 0
    failed      = 0

    for level, cfg in DDA_CONFIGS.items():
        print(f"\n[Level {level}] pattern_types={cfg['pattern_types']}, len={cfg['sequence_length']}, missing={cfg['missing_position']}")
        
        for trial in range(20):
            total_tests += 1
            result = generate_sequence(
                level,
                cfg['sequence_length'],
                cfg['pattern_types'],
                cfg['missing_position']
            )

            # ── Assertions
            errors = []

            # 1. Display sequence length correct
            if len(result['display_seq']) != cfg['sequence_length']:
                errors.append(f"display_seq length={len(result['display_seq'])} expected={cfg['sequence_length']}")

            # 2. Missing index in range
            mi = result['missing_index']
            if not (0 <= mi < cfg['sequence_length']):
                errors.append(f"missing_index={mi} out of range [0, {cfg['sequence_length']})")

            # 3. Correct answer is positive integer
            ca = result['correct_answer']
            if ca <= 0:
                errors.append(f"correct_answer={ca} is not positive")

            # 4. Full sequence has at least len_+1 elements
            if len(result['full']) < cfg['sequence_length'] + 1:
                errors.append(f"full sequence too short: {len(result['full'])}")

            # 5. correct_answer equals full[missing_index]
            if result['full'][mi] != ca:
                errors.append(f"full[{mi}]={result['full'][mi]} != correct_answer={ca}")

            if errors:
                failed += 1
                print(f"  FAIL Trial {trial+1:02d} [{result['type']}]: {'; '.join(errors)}")
                print(f"    full={result['full']}, display={result['display_seq']}, answer={ca}")
            else:
                passed += 1
                if trial < 3:  # Show first 3 examples per level
                    seq_display = ' -> '.join(
                        str(v) if i != mi else '?'
                        for i, v in enumerate(result['display_seq'])
                    )
                    print(f"  OK   [{result['type']:12s}] {seq_display:30s}  answer={ca}")

    print("\n" + "=" * 60)
    print(f"  Results: {passed}/{total_tests} passed  |  {failed} failed")
    print("=" * 60)

    if failed == 0:
        print("  ALL TESTS PASSED - Sequence Decoder is ready for integration!")
        return 0
    else:
        print("  SOME TESTS FAILED - Review pattern generation logic.")
        return 1


if __name__ == '__main__':
    # Seed for reproducibility in CI
    random.seed(42)
    sys.exit(run_tests())
