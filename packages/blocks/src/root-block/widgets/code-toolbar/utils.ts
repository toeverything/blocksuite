import type { CodeBlockModel } from '@blocksuite/affine-model';

export const duplicateCodeBlock = (model: CodeBlockModel) => {
  const keys = model.keys as (keyof typeof model)[];
  const values = keys.map(key => model[key]);
  const blockProps = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  const { text, ...duplicateProps } = blockProps;

  const newProps = {
    flavour: model.flavour,
    text: model.text.clone(),
    ...duplicateProps,
  };

  return model.doc.addSiblingBlocks(model, [newProps])[0];
};
