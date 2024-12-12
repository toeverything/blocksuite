import type { Command } from '@blocksuite/block-std';

export const indentBlocks: Command<
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

  // Find the first model that can be indented
  let firstIndentIndex = -1;
  for (let i = 0; i < blockIds.length; i++) {
    const previousSibling = doc.getPrev(blockIds[i]);
    const model = doc.getBlock(blockIds[i])?.model;
    if (
      model &&
      previousSibling &&
      schema.isValid(model.flavour, previousSibling.flavour)
    ) {
      firstIndentIndex = i;
      break;
    }
  }

  // No model can be indented
  if (firstIndentIndex === -1) return;

  if (stopCapture) doc.captureSync();
  // Models waiting to be indented
  const indentIds = blockIds.slice(firstIndentIndex);
  indentIds.forEach(id => {
    std.command.exec('indentBlock', { blockId: id, stopCapture: false });
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
