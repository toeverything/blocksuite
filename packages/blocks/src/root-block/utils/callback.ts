import type { BlockElement, EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import type { RichText } from '../../_common/components/rich-text/rich-text.js';
import {
  asyncGetRichTextByModel,
  buildPath,
} from '../../_common/utils/query.js';

export async function onModelTextUpdated(
  editorHost: EditorHost,
  model: BlockModel,
  callback?: (text: RichText) => void
) {
  const richText = await asyncGetRichTextByModel(editorHost, model);
  assertExists(richText, 'RichText is not ready yet.');
  await richText.updateComplete;
  const inlineEditor = richText.inlineEditor;
  assertExists(inlineEditor, 'Inline editor is not ready yet.');
  inlineEditor.slots.renderComplete.once(() => {
    if (callback) {
      callback(richText);
    }
  });
}

// Run the callback until a model's element updated.
// Please notice that the callback will be called **once the element itself is ready**.
// The children may be not updated.
// If you want to wait for the text elements,
// please use `onModelTextUpdated`.
export async function onModelElementUpdated(
  editorHost: EditorHost,
  model: BlockModel,
  callback: (blockElement: BlockElement) => void
) {
  const page = model.doc;
  assertExists(page.root);

  const rootElement = editorHost.view.viewFromPath('block', [page.root.id]);
  if (!rootElement) return;
  await rootElement.updateComplete;

  const element = editorHost.view.viewFromPath('block', buildPath(model));
  if (element) callback(element);
}
