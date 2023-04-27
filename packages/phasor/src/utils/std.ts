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
