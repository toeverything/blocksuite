import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import { type BaseBlockModel, Text } from '@blocksuite/store';

import type { Flavour } from '../../../models.js';

/**
 * This file should only contain functions that are used to
 * operate on block models in store, which means that this operations
 * just operate on data and will not involve in something about ui like selection reset.
 */

export function mergeToCodeModel(models: BaseBlockModel[]) {
  if (models.length === 0) {
    throw new Error('No models to merge');
  }
  const page = models[0].page;

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

export function transformModel(
  model: BaseBlockModel,
  flavour: Flavour,
  props?: Parameters<Page['addBlock']>[1]
) {
  const page = model.page;
  const parent = page.getParent(model);
  assertExists(parent);
  const blockProps: {
    type?: string;
    text?: Text;
    children?: BaseBlockModel[];
  } = {
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
    ...props,
  };
  const index = parent.children.indexOf(model);

  // Sometimes the new block can not be added due to some reason, e.g. invalid schema check.
  // So we need to try to add the new block first, and if it fails, we will not delete the old block.
  const id = page.addBlock(flavour, blockProps, parent, index);
  page.deleteBlock(model);
  return id;
}
