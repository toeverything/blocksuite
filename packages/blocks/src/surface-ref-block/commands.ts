import type { SurfaceRefProps } from '@blocksuite/affine-model';
import type { BlockCommands, Command } from '@blocksuite/block-std';

import { matchFlavours } from '@blocksuite/affine-shared/utils';

import { getSurfaceBlock } from './utils.js';

export const insertSurfaceRefBlockCommand: Command<
  'selectedModels',
  'insertedSurfaceRefBlockId',
  {
    reference: string;
    place: 'after' | 'before';
    removeEmptyLine?: boolean;
  }
> = (ctx, next) => {
  const { selectedModels, reference, place, removeEmptyLine, std } = ctx;
  if (!selectedModels?.length) return;

  const targetModel =
    place === 'before'
      ? selectedModels[0]
      : selectedModels[selectedModels.length - 1];

  const surfaceRefProps: Partial<SurfaceRefProps> & {
    flavour: 'affine:surface-ref';
  } = {
    flavour: 'affine:surface-ref',
    reference,
  };

  const surface = getSurfaceBlock(std.doc);
  if (!surface) return;

  const element = surface.getElementById(reference);
  const blockModel = std.doc.getBlock(reference)?.model ?? null;

  if (element?.type === 'group') {
    surfaceRefProps.refFlavour = 'group';
  } else if (matchFlavours(blockModel, ['affine:frame'])) {
    surfaceRefProps.refFlavour = 'frame';
  } else {
    console.error(`reference not found ${reference}`);
    return;
  }

  const result = std.doc.addSiblingBlocks(
    targetModel,
    [surfaceRefProps],
    place
  );
  if (result.length === 0) return;

  if (removeEmptyLine && targetModel.text?.length === 0) {
    std.doc.deleteBlock(targetModel);
  }

  next({
    insertedSurfaceRefBlockId: result[0],
  });
};

export const commands: BlockCommands = {
  insertSurfaceRefBlock: insertSurfaceRefBlockCommand,
};
