import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';

import type { RichText } from '../../_common/components/rich-text/rich-text.js';
import {
  asyncGetBlockComponentByModel,
  asyncGetRichTextByModel,
} from '../../_common/utils/query.js';

export async function onModelTextUpdated(
  model: BaseBlockModel,
  callback?: (text: RichText) => void
) {
  const richText = await asyncGetRichTextByModel(model);
  assertExists(richText, 'RichText is not ready yet.');
  await richText.updateComplete;
  const inlineEditor = richText.inlineEditor;
  assertExists(inlineEditor, 'Inline editor is not ready yet.');
  inlineEditor.slots.updated.once(() => {
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
  model: BaseBlockModel,
  callback: (blockElement: BlockElement) => void
) {
  const element = await asyncGetBlockComponentByModel(model);
  if (element) {
    callback(element);
  }
}
