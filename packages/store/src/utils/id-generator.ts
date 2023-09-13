import { uuidv4 as uuidv4IdGenerator } from 'lib0/random.js';
import { nanoid as nanoidGenerator } from 'nanoid';

export type IdGenerator = (
  type: 'workspace' | 'page' | 'block' | 'unknown'
) => string;

export function createAutoIncrementIdGenerator(): IdGenerator {
  let i = 0;
  return () => (i++).toString();
}

export function createAutoIncrementIdGeneratorByClientId(
  clientId: number
): IdGenerator {
  let i = 0;
  return () => `${clientId}:${i++}`;
}

export const uuidv4: IdGenerator = type => {
  const base = uuidv4IdGenerator();
  if (type === 'unknown') {
    return base;
  }
  return `${type}:${base}`;
};

export const nanoid: IdGenerator = type => {
  const base = nanoidGenerator(10);
  if (type === 'unknown') {
    return base;
  }
  return `${type}:${base}`;
};
