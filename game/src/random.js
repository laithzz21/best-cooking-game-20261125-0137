// A tiny seeded random number generator (mulberry32) so a ?seed=N run of the
// game always deals the same orders, and a screenshot of a seed is repeatable.
export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    /** The next pseudo-random number in [0, 1). */
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** A whole number in [0, count). */
    int(count) {
      return Math.floor(this.next() * count);
    },
    /** One element of an array, picked uniformly. */
    pick(list) {
      return list[this.int(list.length)];
    },
  };
}
