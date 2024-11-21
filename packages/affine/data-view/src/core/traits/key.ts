export interface TraitKey<T> {
  key: symbol;
  __type?: T;
}

export function createTraitKey<T>(name: string): TraitKey<T> {
  return {
    key: Symbol(name),
  };
}
