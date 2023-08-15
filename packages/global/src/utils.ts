import type { BaseBlockModel } from '@blocksuite/store';

import type { BlockModels } from './types.js';

export * from './utils/index.js';

export function assertFlavours(model: { flavour: string }, allowed: string[]) {
  if (!allowed.includes(model.flavour)) {
    throw new Error(`model flavour ${model.flavour} is not allowed`);
  }
}

type BlockModelKey = keyof BlockModels;
type Flavours<T> = T extends BlockModelKey[] ? BlockModels[T[number]] : never;
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export function matchFlavours<const Key extends readonly string[]>(
  model: BaseBlockModel,
  expected: Key
): model is Flavours<Writeable<Key>> {
  return expected.includes(model.flavour);
}
