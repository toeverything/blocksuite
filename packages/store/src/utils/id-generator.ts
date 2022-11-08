export { uuidv4 } from 'lib0/random';

export const createAutoIncrement = () => {
  let i = 0;

  return function autoIncrement(): string {
    return (i++).toString();
  };
};
