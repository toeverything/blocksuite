import { uuidv4 as uuidv4IdGenerator } from 'lib0/random';

export type IdGenerator = () => string;

export function createAutoIncrementIdGenerator(): IdGenerator {
  let i = 0;
  return () => (i++).toString();
}

export function uuidv4() {
  return uuidv4IdGenerator();
}
