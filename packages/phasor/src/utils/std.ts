import { nanoid } from 'nanoid';

export function generateElementId() {
  return nanoid(10);
}
