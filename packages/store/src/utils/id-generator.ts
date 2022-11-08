import { uuidv4 as uuidv4WithoutType } from 'lib0/random';

export type IdGenerator = () => string;

export const createAutoIncrement = (): IdGenerator => {
  let i = 0;

  return function autoIncrement(): string {
    return (i++).toString();
  };
};

export const uuidv4: IdGenerator = () => uuidv4WithoutType();
