import { assertExists } from '@blocksuite/global/utils';
import { type BlockModel, type Doc, Text } from '@blocksuite/store';

/**
 * This file should only contain functions that are used to
 * operate on block models in store, which means that this operations
 * just operate on data and will not involve in something about ui like selection reset.
 */

export function mergeToCodeModel(models: BlockModel[]) {
  if (models.length === 0) {
    return null;
  }
  const doc = models[0].doc;

  const parent = doc.getParent(models[0]);
  if (!parent) {
    return null;
  }
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
  models.map(model => doc.deleteBlock(model));

  const id = doc.addBlock(
    'affine:code',
    { text: new Text(text) },
    parent,
    index
  );
  return id;
}

export function transformModel(
  model: BlockModel,
  flavour: BlockSuite.Flavour,
  props?: Parameters<Doc['addBlock']>[1]
) {
  const doc = model.doc;
  const parent = doc.getParent(model);
  assertExists(parent);
  const blockProps: {
    type?: string;
    text?: Text;
    children?: BlockModel[];
  } = {
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
    ...props,
  };
  const index = parent.children.indexOf(model);

  // Sometimes the new block can not be added due to some reason, e.g. invalid schema check.
  // So we need to try to add the new block first, and if it fails, we will not delete the old block.
  const id = doc.addBlock(flavour, blockProps, parent, index);
  doc.deleteBlock(model, {
    deleteChildren: false,
  });
  return id;
}
