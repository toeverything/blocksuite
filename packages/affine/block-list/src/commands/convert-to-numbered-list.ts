import type { Command, EditorHost } from '@blocksuite/block-std';

import { toNumberedList } from '@blocksuite/affine-shared/utils';

export const convertToNumberedListCommand: Command<
  never,
  'listConvertedId',
  {
    id: string;
    order: number; // This parameter may not correspond to the final order.
    stopCapturing?: boolean;
  }
> = (ctx, next) => {
  const { std, id, order, stopCapturing = true } = ctx;
  const host = std.host as EditorHost;
  const doc = host.doc;

  const model = doc.getBlock(id)?.model;
  if (!model || !model.text) return;

  if (stopCapturing) host.doc.captureSync();

  const listConvertedId = toNumberedList(std, model, order);

  if (!listConvertedId) return;

  return next({ listConvertedId });
};
