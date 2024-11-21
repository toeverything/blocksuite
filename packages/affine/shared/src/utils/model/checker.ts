import type { BlockModel, Doc, DraftModel } from '@blocksuite/store';

import { minimatch } from 'minimatch';

export function matchFlavours<Key extends (keyof BlockSuite.BlockModels)[]>(
  model: DraftModel | null,
  expected: Key
): model is BlockSuite.BlockModels[Key[number]] {
  return (
    !!model &&
    expected.some(key =>
      minimatch(model.flavour as keyof BlockSuite.BlockModels, key)
    )
  );
}

export function isInsideBlockByFlavour(
  doc: Doc,
  block: BlockModel | string,
  flavour: string
): boolean {
  const parent = doc.getParent(block);
  if (parent === null) {
    return false;
  }
  if (flavour === parent.flavour) {
    return true;
  }
  return isInsideBlockByFlavour(doc, parent, flavour);
}
