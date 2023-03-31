import type { ColumnSchema } from '@blocksuite/global/database';
import type { BlockModels } from '@blocksuite/global/types';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import { handleBlockSplit } from '../rich-text/rich-text-operations.js';
import { type BlockRange, type OpenBlockInfo } from '../utils/index.js';
import { getVirgoByModel } from '../utils/query.js';

export async function json2block(
  focusedBlockModel: BaseBlockModel,
  pastedBlocks: OpenBlockInfo[],
  range?: BlockRange
) {
  assertExists(range);
  const { page } = focusedBlockModel;
  // After deleteModelsByRange, selected block is must only, and selection is must caret
  const firstBlock = pastedBlocks[0];
  const lastBlock = pastedBlocks[pastedBlocks.length - 1];
  const isFocusedBlockEmpty =
    !focusedBlockModel.text?.length &&
    !matchFlavours(focusedBlockModel, ['affine:list' as const]);
  const shouldMergeFirstBlock =
    !isFocusedBlockEmpty && firstBlock.text && focusedBlockModel.text;
  const shouldMergeLastBlock = focusedBlockModel.text && lastBlock.text;
  const parent = page.getParent(focusedBlockModel);
  assertExists(parent);
  if (pastedBlocks.length === 1) {
    // TODO: optimize textLength
    const textLength =
      firstBlock?.text?.reduce((sum, data) => {
        return sum + (data.insert?.length || 0);
      }, 0) ?? 0;

    if (shouldMergeFirstBlock) {
      focusedBlockModel.text?.insertList(
        firstBlock.text || [],
        range?.startOffset || 0
      );

      await setRange(focusedBlockModel, {
        index: (range?.startOffset ?? 0) + textLength,
        length: 0,
      });
    } else {
      const shouldSplitBlock =
        focusedBlockModel.text?.length !== range.endOffset;

      shouldSplitBlock &&
        (await handleBlockSplit(page, focusedBlockModel, range.startOffset, 0));

      const [id] = addBlocks(
        page,
        pastedBlocks,
        parent,
        parent.children.indexOf(focusedBlockModel) + 1
      );

      const model = page.getBlockById(id);

      assertExists(model);
      if (model.text) {
        await setRange(focusedBlockModel, {
          index: textLength,
          length: 0,
        });
      } else {
        // TODO: set embed block selection
      }
    }

    isFocusedBlockEmpty && page.deleteBlock(focusedBlockModel);
    return;
  }

  await handleBlockSplit(page, focusedBlockModel, range.startOffset, 0);

  if (shouldMergeFirstBlock) {
    focusedBlockModel.text?.insertList(
      firstBlock.text || [],
      range?.startOffset || 0
    );
  }

  const insertPosition =
    parent.children.indexOf(focusedBlockModel) +
    (shouldMergeFirstBlock ? 1 : 0);

  const ids = addBlocks(
    page,
    pastedBlocks.slice(shouldMergeFirstBlock ? 1 : 0),
    parent,
    insertPosition
  );

  isFocusedBlockEmpty && page.deleteBlock(focusedBlockModel);

  const lastModel = page.getBlockById(ids[ids.length - 1]);

  if (shouldMergeLastBlock) {
    assertExists(lastModel);
    const rangeOffset = lastModel.text?.length || 0;
    const nextSiblingModel = page.getNextSibling(lastModel);
    lastModel.text?.join(nextSiblingModel?.text as Text);
    assertExists(nextSiblingModel);
    page.deleteBlock(nextSiblingModel);
    // Wait for the block's rich text mounted
    requestAnimationFrame(() => {
      setRange(lastModel, {
        index: rangeOffset,
        length: 0,
      });
    });
  } else {
    if (lastModel?.text) {
      setRange(lastModel, {
        index: lastModel.text.length,
        length: 0,
      });
    } else {
      // TODO: set embed block selection
    }
  }
}

async function setRange(model: BaseBlockModel, vRange: VRange) {
  const vEditor = getVirgoByModel(model);
  assertExists(vEditor);
  vEditor.setVRange(vRange);
}

// TODO: used old code, need optimize
export function addBlocks(
  page: Page,
  blocks: OpenBlockInfo[],
  parent: BaseBlockModel,
  index: number
) {
  const addedBlockIds: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const flavour = block.flavour as keyof BlockModels;
    const blockProps: Record<string, unknown> = {
      flavour,
      type: block.type as string,
      checked: block.checked,
      sourceId: block.sourceId,
      caption: block.caption,
      width: block.width,
      height: block.height,
      language: block.language,
    };
    if (flavour === 'affine:database') {
      // add ext:columnSchema
      const databaseModel = page.getBlockById(
        block.id
      ) as BlockModels['affine:database'];
      const columnIds = databaseModel.columns as string[];
      const columnSchemas = columnIds
        .map(id => page.getColumnSchema(id))
        .filter((s: ColumnSchema | null): s is ColumnSchema => s !== null);
      const columnSchemaIds = columnSchemas.map(schema => {
        const { id, ...nonIdProps } = schema;
        return page.setColumnSchema(nonIdProps);
      });
      blockProps.columns = columnSchemaIds;
    }

    const id = page.addBlock(flavour, blockProps, parent, index + i);

    addedBlockIds.push(id);
    const model = page.getBlockById(id);

    const initialProps =
      model?.flavour && page.getInitialPropsMapByFlavour(model?.flavour);
    if (initialProps && initialProps.text instanceof Text) {
      block.text && model?.text?.applyDelta(block.text);
    }

    model && block.children && addBlocks(page, block.children, model, 0);
  }

  blocks.forEach((block, index) => {
    if (block.flavour === 'affine:database') {
      // add ext:columns
      const newId = addedBlockIds[index];
      const newModel = page.getBlockById(
        newId
      ) as BlockModels['affine:database'];
      const newColumnSchemaIds = newModel.columns as string[];
      const newColumnIds = newModel.children.map(child => child.id);

      const oldModel = page.getBlockById(
        block.id
      ) as BlockModels['affine:database'];
      const oldColumnSchemaIds = oldModel.columns as string[];
      const oldColumnIds = oldModel.children.map(child => child.id);

      const columnIdMap = oldColumnIds.reduce((prev, oldColumnId, index) => {
        return {
          ...prev,
          [oldColumnId]: newColumnIds[index],
        };
      }, {} as Record<string, string>);
      const columnSchemaIdMap = oldColumnSchemaIds.reduce(
        (prev, oldColumnSchemaId, index) => {
          return {
            ...prev,
            [oldColumnSchemaId]: newColumnSchemaIds[index],
          };
        },
        {} as Record<string, string>
      );
      page.copyBlockColumns(columnIdMap, columnSchemaIdMap);

      // Add a paragraph after database
      page.addBlock('affine:paragraph', {}, parent.id);
    }
  });

  return addedBlockIds;
}
