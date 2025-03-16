import { getSurfaceBlock } from '@blocksuite/affine-block-surface';
import {
  FrameBlockModel,
  type SurfaceRefProps,
} from '@blocksuite/affine-model';
import { matchModels } from '@blocksuite/affine-shared/utils';
import type { Command } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

export const insertSurfaceRefBlockCommand: Command<
  {
    reference: string;
    place: 'after' | 'before';
    removeEmptyLine?: boolean;
    selectedModels?: BlockModel[];
  },
  {
    insertedSurfaceRefBlockId: string;
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

  const surface = getSurfaceBlock(std.store);
  if (!surface) return;

  const element = surface.getElementById(reference);
  const blockModel = std.store.getBlock(reference)?.model ?? null;

  if (element?.type === 'group') {
    surfaceRefProps.refFlavour = 'group';
  } else if (matchModels(blockModel, [FrameBlockModel])) {
    surfaceRefProps.refFlavour = 'frame';
  } else {
    console.error(`reference not found ${reference}`);
    return;
  }

  const result = std.store.addSiblingBlocks(
    targetModel,
    [surfaceRefProps],
    place
  );
  if (result.length === 0) return;

  if (removeEmptyLine && targetModel.text?.length === 0) {
    std.store.deleteBlock(targetModel);
  }

  next({
    insertedSurfaceRefBlockId: result[0],
  });
};
