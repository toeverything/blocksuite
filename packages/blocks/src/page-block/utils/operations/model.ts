import { EDGELESS_BLOCK_CHILD_PADDING } from '@blocksuite/global/config';
import { deserializeXYWH } from '@blocksuite/phasor';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
  Text,
} from '@blocksuite/store';

import { almostEqual } from '../../../__internal__/utils/common.js';
import { getBlockElementByModel } from '../../../__internal__/utils/query.js';
import type { TopLevelBlockModel } from '../../../__internal__/utils/types.js';
import type { Flavour } from '../../../models.js';

/**
 * This file should only contain functions that are used to
 * operate on block models in store, which means that this operations
 * just operate on data and will not involve in something about ui like selection reset.
 */

export function mergeToCodeBlocks(page: Page, models: BaseBlockModel[]) {
  const parent = page.getParent(models[0]);
  assertExists(parent);
  const index = parent.children.indexOf(models[0]);
  const text = models
    .map(model => {
      if (model.text instanceof Text) {
        return model.text.toString();
      }
      return null;
    })
    .filter(Boolean)
    .join('\n');
  models.map(model => page.deleteBlock(model));

  const id = page.addBlock(
    'affine:code',
    { text: new Text(text) },
    parent,
    index
  );
  return id;
}

export function transformBlock(
  model: BaseBlockModel,
  flavour: Flavour,
  type?: string
) {
  const page = model.page;
  const parent = page.getParent(model);
  assertExists(parent);
  const blockProps: {
    type?: string;
    text?: Text;
    children?: BaseBlockModel[];
  } = {
    type,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
  };
  const index = parent.children.indexOf(model);
  page.deleteBlock(model);
  return page.addBlock(flavour, blockProps, parent, index);
}

export function tryUpdateNoteSize(page: Page, zoom: number) {
  requestAnimationFrame(() => {
    if (!page.root) return;
    const notes = page.root.children.filter(
      child => child.flavour === 'affine:note'
    ) as TopLevelBlockModel[];
    notes.forEach(model => {
      // DO NOT resize shape block
      // FIXME: we don't have shape block for now.
      // if (matchFlavours(model, ['affine:shape'])) return;
      const blockElement = getBlockElementByModel(model);
      if (!blockElement) return;
      const bound = blockElement.getBoundingClientRect();

      const [x, y, w, h] = deserializeXYWH(model.xywh);
      const newModelHeight =
        bound.height / zoom + EDGELESS_BLOCK_CHILD_PADDING * 2;
      if (!almostEqual(newModelHeight, h)) {
        page.updateBlock(model, {
          xywh: JSON.stringify([x, y, w, Math.round(newModelHeight)]),
        });
      }
    });
  });
}
