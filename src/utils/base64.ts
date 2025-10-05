/**
 * Base64URL encoding/decoding utilities
 *
 * Compatible with both browser and Node.js environments.
 * Base64URL is a URL-safe variant of Base64 that uses '-' and '_' instead of '+' and '/',
 * and omits padding '=' characters.
 */

/**
 * Encode a Uint8Array to Base64URL string
 * @param bytes - The bytes to encode
 * @returns Base64URL encoded string (no padding)
 */
export function toBase64Url(bytes: Uint8Array): string {
  // Browser-safe path
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  // Node path
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Decode a Base64URL string to Uint8Array
 * @param s - The Base64URL encoded string
 * @returns Decoded bytes
 */
export function fromBase64Url(s: string): Uint8Array {
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  if (typeof atob === 'function') {
    const bin = atob(base64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}
