/** Small deterministic PRNG helpers. These are not cryptographic. */
export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
}

export function createSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0] || 1;
  }
  return (Date.now() >>> 0) || 1;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  if (state === 0) state = 0x6d2b79f5;

  return {
    next() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    },
    int(maxExclusive: number) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new RangeError('maxExclusive must be a positive integer');
      }
      return Math.floor(this.next() * maxExclusive);
    },
  };
}

export function shuffleInPlace<T>(values: T[], rng: Rng): T[] {
  for (let i = values.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}
