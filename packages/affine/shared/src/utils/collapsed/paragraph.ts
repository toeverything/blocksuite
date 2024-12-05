import type { ParagraphBlockModel } from '@blocksuite/affine-model';
import type { BlockModel } from '@blocksuite/store';

import { matchFlavours } from '../model/checker.js';

export function calculateCollapsedSiblings(
  model: ParagraphBlockModel
): BlockModel[] {
  const parent = model.parent;
  if (!parent) return [];
  const children = parent.children;
  const index = children.indexOf(model);
  if (index === -1) return [];

  const collapsedEdgeIndex = children.findIndex((child, i) => {
    if (
      i > index &&
      matchFlavours(child, ['affine:paragraph']) &&
      child.type.startsWith('h')
    ) {
      const modelLevel = parseInt(model.type.slice(1));
      const childLevel = parseInt(child.type.slice(1));
      return childLevel <= modelLevel;
    }
    return false;
  });

  let collapsedSiblings: BlockModel[];
  if (collapsedEdgeIndex === -1) {
    collapsedSiblings = children.slice(index + 1);
  } else {
    collapsedSiblings = children.slice(index + 1, collapsedEdgeIndex);
  }

  return collapsedSiblings;
}

export function getNearestHeadingBefore(
  model: BlockModel
): ParagraphBlockModel | null {
  const parent = model.parent;
  if (!parent) return null;
  const index = parent.children.indexOf(model);
  if (index === -1) return null;

  for (let i = index - 1; i >= 0; i--) {
    const sibling = parent.children[i];
    if (
      matchFlavours(sibling, ['affine:paragraph']) &&
      sibling.type.startsWith('h')
    ) {
      return sibling;
    }
  }

  return null;
}
