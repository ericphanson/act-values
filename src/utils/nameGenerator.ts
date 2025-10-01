import { nanoid } from 'nanoid';

const adjectives = [
  'Cheerful', 'Swift', 'Brave', 'Clever', 'Gentle',
  'Mighty', 'Wise', 'Noble', 'Bold', 'Calm',
  'Bright', 'Wild', 'Free', 'Pure', 'True',
  'Kind', 'Sharp', 'Quick', 'Strong', 'Warm'
];

const animals = [
  'Panda', 'Falcon', 'Dragon', 'Phoenix', 'Tiger',
  'Wolf', 'Eagle', 'Bear', 'Lion', 'Fox',
  'Hawk', 'Owl', 'Deer', 'Raven', 'Otter',
  'Lynx', 'Crane', 'Swan', 'Dolphin', 'Jaguar'
];

/**
 * Generate a random friendly name like "Cheerful Panda" or "Swift Falcon"
 * Uses nanoid to seed the randomness for uniqueness
 */
export function generateFriendlyName(): string {
  // Use first few chars of nanoid as seed for consistent but unique selection
  const seed = nanoid(8);
  const adjIndex = seed.charCodeAt(0) % adjectives.length;
  const animalIndex = seed.charCodeAt(1) % animals.length;

  return `${adjectives[adjIndex]} ${animals[animalIndex]}`;
}

/**
 * Generate a short unique ID for a list
 */
export function generateListId(): string {
  return nanoid(8);
}
