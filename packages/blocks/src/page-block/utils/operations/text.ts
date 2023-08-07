import type { BaseBlockModel } from '@blocksuite/store';

import type { RichText } from '../../../__internal__/rich-text/rich-text.js';
import { asyncGetRichTextByModel } from '../../../__internal__/utils/query.js';

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
