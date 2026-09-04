#!/usr/bin/env python3
U64=(1<<64)-1
def energy(micro_j_per_mol,nano_mol_per_step):
    if not (0<=micro_j_per_mol<=U64 and 0<=nano_mol_per_step<=U64): raise ValueError
    x=micro_j_per_mol*nano_mol_per_step
    if x>U64: raise OverflowError
    return x
assert energy(50_000,2_000)==100_000_000
try: energy(U64,2); raise AssertionError('overflow accepted')
except OverflowError: pass
print('P5 Wave IV geochemical independent oracle PASS 100000000')
