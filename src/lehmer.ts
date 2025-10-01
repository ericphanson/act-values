/**
 * lehmer-tierlink.ts
 *
 * Compact, URL-friendly encoding of a 3-tier ranking of N items using
 * a Lehmer (factoradic) code of the permutation plus two cut points.
 *
 * - Encodes the *permutation* P = Very ⧺ Somewhat ⧺ Not as a BigInt (Lehmer rank)
 * - Stores header: [version:1][k1:U16][k2:U16] + rank bytes (big-endian, minimal)
 * - Base64URL encodes the bytes to produce a short, shareable fragment
 *
 * Decoding needs N (the dataset size). This keeps fragments short.
 *
 * Works in browsers and Node (no deps). Target ES2020+ for BigInt support.
 */

export interface TierState {
  very: number[];
  somewhat: number[];
  not: number[];
}

export interface EncodeOptions {
  /** If true (default), returns '#...' ready to append to location.hash */
  withHash?: boolean;
}

export interface DecodedPermutation {
  perm: number[]; // concatenated [very ⧺ somewhat ⧺ not]
  k1: number;     // |very|
  k2: number;     // |somewhat|
}

/** Version byte for forward-compat headers */
export const VERSION = 1;

/* ============================== Public API =============================== */

/**
 * Encode a TierState into a compact Base64URL fragment using Lehmer coding.
 *
 * @param state  TierState (very/somewhat/not). Missing indices will be appended to 'not' in ascending order.
 * @param N      Total number of items (indices are 0..N-1)
 * @param opts   { withHash?: boolean } default true
 * @returns      Base64URL string (with or without leading '#')
 */
export function encodeTierStateToFragment(
  state: TierState,
  N: number,
  opts: EncodeOptions = { withHash: true }
): string {
  const { perm, k1, k2 } = canonicalizeToPermutation(state, N);
  const bytes = encodePermutationToBytes(perm, k1, k2);
  const frag = toBase64Url(bytes);
  return opts.withHash !== false ? `#${frag}` : frag;
}

/**
 * Decode a Base64URL fragment back into a TierState.
 *
 * @param fragmentOrHash  Base64URL payload, with or without leading '#'
 * @param N               Total number of items (0..N-1)
 * @returns               { very, somewhat, not }
 */
export function decodeFragmentToTierState(
  fragmentOrHash: string,
  N: number
): TierState {
  const { perm, k1, k2 } = decodeFragmentToPermutation(fragmentOrHash, N);
  return {
    very: perm.slice(0, k1),
    somewhat: perm.slice(k1, k1 + k2),
    not: perm.slice(k1 + k2),
  };
}

/**
 * Low-level: encode a permutation + cut points into bytes (header + rank).
 *
 * @param perm permutation of 0..N-1 (N = perm.length)
 * @param k1   size of "very"
 * @param k2   size of "somewhat"
 */
export function encodePermutationToBytes(perm: number[], k1: number, k2: number): Uint8Array {
  validatePermutation(perm);
  const n = perm.length;
  if (k1 < 0 || k2 < 0 || k1 + k2 > n) {
    throw new Error(`Invalid cut points k1=${k1}, k2=${k2} for N=${n}`);
  }
  const digits = lehmerDigitsFromPermutation(perm);
  const rank = lehmerRankFromDigits(digits); // BigInt
  const header = new Uint8Array(1 + 2 + 2);
  header[0] = VERSION;
  header.set(u16be(k1), 1);
  header.set(u16be(k2), 3);
  const payload = bigIntToBytesBE(rank);
  const out = new Uint8Array(header.length + payload.length);
  out.set(header, 0);
  out.set(payload, header.length);
  return out;
}

/**
 * Low-level: decode a fragment back to permutation + cut points.
 *
 * @param fragmentOrHash Base64URL payload, with or without leading '#'
 * @param N              number of items
 */
export function decodeFragmentToPermutation(fragmentOrHash: string, N: number): DecodedPermutation {
  if (!Number.isInteger(N) || N < 0 || N > 65535) {
    throw new Error(`N must be an integer in [0, 65535], got ${N}`);
  }
  const frag = fragmentOrHash.startsWith('#') ? fragmentOrHash.slice(1) : fragmentOrHash;
  const bytes = fromBase64Url(frag);
  if (bytes.length < 5) throw new Error('Fragment too short');

  const ver = bytes[0];
  if (ver !== VERSION) throw new Error(`Unsupported version ${ver}`);

  const k1 = (bytes[1] << 8) | bytes[2];
  const k2 = (bytes[3] << 8) | bytes[4];
  if (k1 < 0 || k2 < 0 || k1 + k2 > N) {
    throw new Error(`Invalid cut points in fragment: k1=${k1}, k2=${k2}, N=${N}`);
  }

  const rankBytes = bytes.slice(5);
  const rank = bytesToBigIntBE(rankBytes);
  const digits = lehmerDigitsFromRank(rank, N); // length N
  const perm = permutationFromLehmerDigits(digits);
  return { perm, k1, k2 };
}

/* ============================== Internals ================================ */

/** Build canonical permutation from TierState: Very ⧺ Somewhat ⧺ Not ⧺ (any missing -> appended to Not) */
function canonicalizeToPermutation(state: TierState, N: number): DecodedPermutation {
  if (!Number.isInteger(N) || N <= 0 || N > 65535) {
    throw new Error(`N must be an integer in [1, 65535], got ${N}`);
  }
  const seen = new Uint8Array(N);
  const outVery = uniqueChecked(state.very, seen, N, 'very');
  const outSome = uniqueChecked(state.somewhat, seen, N, 'somewhat');
  const outNot = uniqueChecked(state.not, seen, N, 'not');

  // Append missing indices (if any) to the "not" tier (ascending). This keeps encoding canonical.
  if (outVery.length + outSome.length + outNot.length < N) {
    for (let i = 0; i < N; i++) {
      if (!seen[i]) outNot.push(i);
    }
  }

  const perm = outVery.concat(outSome, outNot);
  return { perm, k1: outVery.length, k2: outSome.length };
}

/** Ensure list is unique, in-range, and mark seen[]; returns a shallow copy */
function uniqueChecked(arr: number[] | undefined, seen: Uint8Array, N: number, label: string): number[] {
  const out: number[] = [];
  if (!arr) return out;
  for (const x of arr) {
    if (!Number.isInteger(x) || x < 0 || x >= N) {
      throw new Error(`Index out of range in ${label}: ${x} (N=${N})`);
    }
    if (seen[x]) {
      throw new Error(`Duplicate index ${x} in ${label}`);
    }
    seen[x] = 1;
    out.push(x);
  }
  return out;
}

/** Validate permutation of 0..N-1 */
function validatePermutation(perm: number[]): void {
  const n = perm.length;
  if (n === 0) throw new Error('Permutation cannot be empty');
  if (n > 65535) throw new Error('N too large for this header encoding (max 65535)');
  const seen = new Uint8Array(n);
  for (const v of perm) {
    if (!Number.isInteger(v) || v < 0 || v >= n) {
      throw new Error(`Invalid element in permutation: ${v}`);
    }
    if (seen[v]) throw new Error(`Duplicate element in permutation: ${v}`);
    seen[v] = 1;
  }
}

/** Compute Lehmer digits from permutation (O(N^2), fine for N≈200) */
function lehmerDigitsFromPermutation(perm: number[]): number[] {
  const n = perm.length;
  const rem: number[] = Array.from({ length: n }, (_, i) => i);
  const digits: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const p = perm[i];
    const idx = rem.indexOf(p);
    // idx ∈ [0, n-1-i]
    digits[i] = idx;
    rem.splice(idx, 1);
  }
  return digits;
}

/**
 * Rank a permutation given its Lehmer digits (BigInt).
 *
 * Factoradic value: a0*(n-1)! + a1*(n-2)! + ... + a_{n-1}*0!
 * Iterative (stable) form: rank = (((a0)* (n-1) + a1) * (n-2) + a2) * ... + a_{n-1}
 */
function lehmerRankFromDigits(digits: number[]): bigint {
  const n = digits.length;
  let rank = 0n;
  for (let i = 0; i < n; i++) {
    const base = BigInt(n - i);
    rank = rank * base + BigInt(digits[i]);
  }
  // The iterative formula above actually multiplies once too many times.
  // To correct: subtract the last multiplication by base=1 (no-op), so it's fine.
  // Alternatively, implement canonical:
  // rank = a0*(n-1)! + a1*(n-2)! + ... + a_{n-2}*1! + a_{n-1}*0!
  // We'll provide an exact version below to avoid confusion:

  // Exact factorial-base version:
  // let r = 0n, fact = 1n;
  // for (let i = n - 1; i >= 0; i--) {
  //   r += BigInt(digits[i]) * fact;
  //   fact *= BigInt(n - i);
  // }
  // return r;

  // Use the exact version for clarity:
  let r = 0n;
  let fact = 1n; // (0)!
  for (let i = n - 1; i >= 0; i--) {
    r += BigInt(digits[i]) * fact;
    fact *= BigInt(n - i); // next factorial base
  }
  return r;
}

/** Recover Lehmer digits from rank for permutations of size N */
function lehmerDigitsFromRank(rank: bigint, N: number): number[] {
  const digits = new Array<number>(N);
  let x = rank;
  // For i=1..N: digits[N - i] = x % i; x = floor(x / i)
  for (let i = 1; i <= N; i++) {
    const bi = BigInt(i);
    const r = x % bi;
    digits[N - i] = Number(r);
    x = x / bi;
  }
  if (x !== 0n) {
    // This would mean rank >= N!, which is invalid.
    throw new Error('Rank out of range for N');
  }
  return digits;
}

/** Build permutation back from Lehmer digits */
function permutationFromLehmerDigits(digits: number[]): number[] {
  const n = digits.length;
  const rem: number[] = Array.from({ length: n }, (_, i) => i);
  const perm: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const idx = digits[i];
    perm[i] = rem[idx];
    rem.splice(idx, 1);
  }
  return perm;
}

/* ----------------------------- Byte helpers ----------------------------- */

function u16be(n: number): Uint8Array {
  if (!Number.isInteger(n) || n < 0 || n > 0xffff) throw new Error(`u16 out of range: ${n}`);
  return new Uint8Array([(n >>> 8) & 0xff, n & 0xff]);
}

function bigIntToBytesBE(x: bigint): Uint8Array {
  if (x === 0n) return new Uint8Array([0]);
  const out: number[] = [];
  let v = x;
  while (v > 0n) {
    out.push(Number(v & 0xffn));
    v >>= 8n;
  }
  out.reverse();
  return new Uint8Array(out);
}

function bytesToBigIntBE(bytes: Uint8Array): bigint {
  let x = 0n;
  for (const b of bytes) {
    x = (x << 8n) | BigInt(b);
  }
  return x;
}

/* --------------------------- Base64URL helpers -------------------------- */

function toBase64Url(bytes: Uint8Array): string {
  // Browser-safe path
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  // Node path
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(s: string): Uint8Array {
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  if (typeof atob === 'function') {
    const bin = atob(base64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/* ============================== Example use ============================= */
/*
const N = 200;
const state: TierState = {
  very: [12,5,7,19],
  somewhat: [0,2,8],
  not: [1,3,4,6] // missing indices (9..199) will be appended to 'not'
};

const fragment = encodeTierStateToFragment(state, N); // e.g., "#AQ..."
console.log('Fragment:', fragment);

const decoded = decodeFragmentToTierState(fragment, N);
console.log(decoded.very, decoded.somewhat, decoded.not);
*/

/* ============================== Export default ========================== */
export default {
  VERSION,
  encodeTierStateToFragment,
  decodeFragmentToTierState,
  encodePermutationToBytes,
  decodeFragmentToPermutation,
};
