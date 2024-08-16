import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { matchFlavours } from '@blocksuite/affine-shared/utils';

import type { ExtendedModel } from '../../types.js';

export function handleRemoveAllIndent(
  editorHost: EditorHost,
  model: ExtendedModel,
  restoreSelection = true
) {
  const selection = [...editorHost.selection.value];
  const doc = model.doc;
  let parent = doc.getParent(model);
  while (parent && !matchFlavours(parent, ['affine:note'])) {
    editorHost.command.exec('dedentBlock', { blockId: model.id });
    parent = doc.getParent(model);
  }
  if (restoreSelection) {
    editorHost.updateComplete
      .then(() => {
        editorHost.selection.set(selection);
      })
      .catch(console.error);
  }
}

export function handleRemoveAllIndentForMultiBlocks(
  editorHost: EditorHost,
  models: BlockModel[]
) {
  if (!models.length) return;
  const selection = [...editorHost.selection.value];
  const doc = models[0].doc;
  doc.captureSync();
  for (let i = models.length - 1; i >= 0; i--) {
    const model = models[i];
    const parent = doc.getParent(model);
    if (parent && !matchFlavours(parent, ['affine:note'])) {
      handleRemoveAllIndent(editorHost, model, false);
    }
  }
  editorHost.updateComplete
    .then(() => {
      editorHost.selection.set(selection);
    })
    .catch(console.error);
}
