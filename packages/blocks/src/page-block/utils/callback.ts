import type { BlockElement } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';

import type { RichText } from '../../__internal__/rich-text/rich-text.js';
import {
  asyncGetBlockElementByModel,
  asyncGetRichTextByModel,
} from '../../__internal__/utils/query.js';

export async function onModelTextUpdated(
  model: BaseBlockModel,
  callback?: (text: RichText) => void
) {
  const richText = await asyncGetRichTextByModel(model);
  richText?.vEditor?.slots.updated.once(() => {
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
  const element = await asyncGetBlockElementByModel(model);
  if (element) {
    callback(element);
  }
}
