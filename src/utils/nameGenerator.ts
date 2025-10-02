import { customAlphabet } from 'nanoid';

// Use only alphanumeric characters (no symbols)
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 4);

/**
 * Generate a friendly name like "My values - a13b"
 * Format ensures uniqueness even when shared
 */
export function generateFriendlyName(): string {
  const uniqueId = nanoid(); // Short 4-character alphanumeric suffix
  return `My values - ${uniqueId}`;
}

/**
 * Generate a short unique ID for a list
 */
export function generateListId(): string {
  return nanoid(8);
}
