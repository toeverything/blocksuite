import type { Command } from '@blocksuite/block-std';

export const dedentBlocks: Command<
  never,
  never,
  {
    blockIds?: string[];
    stopCapture?: boolean;
  }
> = (ctx, next) => {
  let { blockIds } = ctx;
  const { std, stopCapture = true } = ctx;
  const { doc, selection, range, host } = std;
  const { schema } = doc;

  if (!blockIds || !blockIds.length) {
    const nativeRange = range.value;
    if (nativeRange) {
      const topBlocks = range.getSelectedBlockComponentsByRange(nativeRange, {
        match: el => el.model.role === 'content',
        mode: 'highest',
      });
      if (topBlocks.length > 0) {
        blockIds = topBlocks.map(block => block.blockId);
      }
    } else {
      blockIds = std.selection.getGroup('note').map(sel => sel.blockId);
    }
  }

  if (!blockIds || !blockIds.length || doc.readonly) return;

  // Find the first model that can be unindented
  let firstDedentIndex = -1;
  for (let i = 0; i < blockIds.length; i++) {
    const model = doc.getBlock(blockIds[i])?.model;
    if (!model) continue;
    const parent = doc.getParent(blockIds[i]);
    if (!parent) continue;
    const grandParent = doc.getParent(parent);
    if (!grandParent) continue;

    if (schema.isValid(model.flavour, grandParent.flavour)) {
      firstDedentIndex = i;
      break;
    }
  }

  if (firstDedentIndex === -1) return;

  if (stopCapture) doc.captureSync();
  const dedentIds = blockIds.slice(firstDedentIndex);
  dedentIds.forEach(id => {
    std.command.exec('dedentBlock', { blockId: id, stopCapture: false });
  });

  const textSelection = selection.find('text');
  if (textSelection) {
    host.updateComplete
      .then(() => {
        range.syncTextSelectionToRange(textSelection);
      })
      .catch(console.error);
  }

  return next();
};
