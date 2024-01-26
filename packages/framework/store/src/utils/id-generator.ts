import { uuidv4 as uuidv4IdGenerator } from 'lib0/random.js';
import { nanoid as nanoidGenerator } from 'nanoid';

export type IdGenerator = () => string;

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

export const uuidv4: IdGenerator = () => {
  return uuidv4IdGenerator();
};

export const nanoid: IdGenerator = () => {
  return nanoidGenerator(10);
};
