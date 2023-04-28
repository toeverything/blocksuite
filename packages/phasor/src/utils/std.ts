import { nanoid } from 'nanoid';

export function generateElementId() {
  return nanoid(10);
}

/**
 * Converts the specified value to the specified data type
 */
export function typecast<T>(v: unknown): T {
  return v as unknown as T;
}
