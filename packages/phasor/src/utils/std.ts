import { nanoid } from 'nanoid';

export function simplePick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((acc, k) => {
    if (k in obj) {
      acc[k] = obj[k];
    }
    return acc;
  }, {} as Pick<T, K>);
}

export function generateElementId() {
  return nanoid(10);
}

/**
 * Converts the specified value to the specified data type
 */
export function typecast<T>(v: unknown): T {
  return v as unknown as T;
}
