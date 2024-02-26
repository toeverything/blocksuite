import { nanoid } from 'nanoid';

export function generateAnnotationKey() {
  return nanoid(10);
}
