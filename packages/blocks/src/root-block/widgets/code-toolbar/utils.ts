import { Slice } from '@blocksuite/store';

import { toast } from '../../../_common/components/toast.js';
import type {
  CodeBlockComponent,
  CodeBlockModel,
} from '../../../code-block/index.js';

export const copyCode = (code: CodeBlockComponent) => {
  const model = code.model;
  const slice = Slice.fromModels(model.doc, [model]);
  code.std.clipboard
    .copySlice(slice)
    .then(() => {
      toast(code.host, 'Copied to clipboard');
    })
    .catch(e => {
      toast(code.host, 'Copied failed, something went wrong');
      console.error(e);
    });
};

export const duplicateCodeBlock = (model: CodeBlockModel) => {
  const { text, language, wrap, flavour } = model;
  const newProps = { text: text.clone(), language, wrap, flavour };
  return model.doc.addSiblingBlocks(model, [newProps])[0];
};
