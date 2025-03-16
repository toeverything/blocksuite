import { FileSizeLimitService } from '@blocksuite/affine-shared/services';
import { getImageFilesFromLocal } from '@blocksuite/affine-shared/utils';
import type { Command } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { addSiblingImageBlock } from '../utils.js';

export const insertImagesCommand: Command<
  {
    selectedModels?: BlockModel[];
    removeEmptyLine?: boolean;
    place?: 'after' | 'before';
  },
  {
    insertedImageIds: Promise<string[]>;
  }
> = (ctx, next) => {
  const { selectedModels, place, removeEmptyLine, std } = ctx;
  if (!selectedModels) return;

  return next({
    insertedImageIds: getImageFilesFromLocal().then(imageFiles => {
      if (imageFiles.length === 0) return [];

      if (selectedModels.length === 0) return [];

      const targetModel =
        place === 'before'
          ? selectedModels[0]
          : selectedModels[selectedModels.length - 1];

      const maxFileSize = std.store.get(FileSizeLimitService).maxFileSize;

      const result = addSiblingImageBlock(
        std.host,
        imageFiles,
        maxFileSize,
        targetModel,
        place
      );
      if (removeEmptyLine && targetModel.text?.length === 0) {
        std.store.deleteBlock(targetModel);
      }

      return result ?? [];
    }),
  });
};
