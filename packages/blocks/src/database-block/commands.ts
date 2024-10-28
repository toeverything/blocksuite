import type { BlockCommands, Command } from '@blocksuite/block-std';

export const insertDatabaseBlockCommand: Command<
  'selectedModels',
  'insertedDatabaseBlockId',
  {
    viewType: string;
    place?: 'after' | 'before';
    removeEmptyLine?: boolean;
  }
> = (ctx, next) => {
  const { selectedModels, viewType, place, removeEmptyLine, std } = ctx;
  if (!selectedModels?.length) return;

  const targetModel =
    place === 'before'
      ? selectedModels[0]
      : selectedModels[selectedModels.length - 1];

  const service = std.getService('affine:database');
  if (!service) return;

  const result = std.doc.addSiblingBlocks(
    targetModel,
    [{ flavour: 'affine:database' }],
    place
  );
  if (result.length === 0) return;

  service.initDatabaseBlock(std.doc, targetModel, result[0], viewType, false);

  if (removeEmptyLine && targetModel.text?.length === 0) {
    std.doc.deleteBlock(targetModel);
  }

  next({ insertedDatabaseBlockId: result[0] });
};

export const commands: BlockCommands = {
  insertDatabaseBlock: insertDatabaseBlockCommand,
};
