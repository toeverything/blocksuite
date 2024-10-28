import type { LatexProps } from '@blocksuite/affine-model';
import type { BlockCommands, Command } from '@blocksuite/block-std';

import { assertInstanceOf } from '@blocksuite/global/utils';

import { LatexBlockComponent } from './latex-block.js';

export const insertLatexBlockCommand: Command<
  'selectedModels',
  'insertedLatexBlockId',
  {
    latex?: string;
    place?: 'after' | 'before';
    removeEmptyLine?: boolean;
  }
> = (ctx, next) => {
  const { selectedModels, latex, place, removeEmptyLine, std } = ctx;
  if (!selectedModels?.length) return;

  const targetModel =
    place === 'before'
      ? selectedModels[0]
      : selectedModels[selectedModels.length - 1];

  const latexBlockProps: Partial<LatexProps> & {
    flavour: 'affine:latex';
  } = {
    flavour: 'affine:latex',
    latex: latex ?? '',
  };

  const result = std.doc.addSiblingBlocks(
    targetModel,
    [latexBlockProps],
    place
  );
  if (result.length === 0) return;

  if (removeEmptyLine && targetModel.text?.length === 0) {
    std.doc.deleteBlock(targetModel);
  }

  next({
    insertedLatexBlockId: std.host.updateComplete.then(async () => {
      if (!latex) {
        const blockComponent = std.view.getBlock(result[0]);
        assertInstanceOf(blockComponent, LatexBlockComponent);
        await blockComponent.updateComplete;
        blockComponent.toggleEditor();
      }
      return result[0];
    }),
  });
};

export const commands: BlockCommands = {
  insertLatexBlock: insertLatexBlockCommand,
};
