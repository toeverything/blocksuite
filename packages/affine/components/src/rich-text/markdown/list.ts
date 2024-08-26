import type { ListProps, ListType } from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { matchFlavours, toNumberedList } from '@blocksuite/affine-shared/utils';

import { focusTextModel } from '../dom.js';
import { beforeConvert } from './utils.js';

export function toList(
  std: BlockStdScope,
  model: BlockModel,
  listType: ListType,
  prefix: string,
  otherProperties?: Partial<ListProps>
) {
  if (!matchFlavours(model, ['affine:paragraph'])) {
    return;
  }
  const { doc } = std;
  const parent = doc.getParent(model);
  if (!parent) return;

  beforeConvert(std, model, prefix.length);

  if (listType !== 'numbered') {
    const index = parent.children.indexOf(model);
    const blockProps = {
      type: listType,
      text: model.text?.clone(),
      children: model.children,
      ...otherProperties,
    };
    doc.deleteBlock(model, {
      deleteChildren: false,
    });

    const id = doc.addBlock('affine:list', blockProps, parent, index);
    focusTextModel(std, id);
    return id;
  }

  let order = parseInt(prefix.slice(0, -1));
  if (!Number.isInteger(order)) order = 1;

  const id = toNumberedList(std, model, order);
  if (!id) return;

  focusTextModel(std, id);
  return id;
}
