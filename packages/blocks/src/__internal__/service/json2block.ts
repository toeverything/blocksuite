import { assertExists } from '@blocksuite/global/utils';
import { BaseBlockModel, Page, Text } from '@blocksuite/store';

import { handleBlockSplit } from '../rich-text/rich-text-operations.js';
import {
  getCurrentBlockRange,
  getRichTextByModel,
  OpenBlockInfo,
} from '../utils/index.js';

export const json2block = (
  focusedBlockModel: BaseBlockModel,
  pastedBlocks: OpenBlockInfo[]
) => {
  const { page } = focusedBlockModel;
  const range = getCurrentBlockRange(page);
  assertExists(range);
  // After deleteModelsByRange, selected block is must only, and selection is must caret
  const firstBlock = pastedBlocks[0];
  const lastBlock = pastedBlocks[pastedBlocks.length - 1];
  const shouldMergeFirstBlock = firstBlock.text && focusedBlockModel.text;
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
        range.startOffset
      );

      getRichTextByModel(focusedBlockModel)?.quill.setSelection(
        range.startOffset + textLength,
        0
      );
    } else {
      const shouldSplitBlock =
        focusedBlockModel.text?.length !== range.endOffset;

      shouldSplitBlock &&
        handleBlockSplit(page, focusedBlockModel, range.startOffset, 0);
      const [id] = addBlocks(
        page,
        pastedBlocks,
        parent,
        parent.children.indexOf(focusedBlockModel) + 1
      );

      const model = page.getBlockById(id);

      assertExists(model);
      if (model.text) {
        getRichTextByModel(model)?.quill.setSelection(textLength, 0);
      } else {
        // TODO: set embed block selection
      }
    }
    return;
  }

  handleBlockSplit(page, focusedBlockModel, range.startOffset, 0);

  if (shouldMergeFirstBlock) {
    focusedBlockModel.text?.insertList(
      firstBlock.text || [],
      range.startOffset
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

  const lastModel = page.getBlockById(ids[ids.length - 1]);
  if (shouldMergeLastBlock) {
    assertExists(lastModel);
    const rangeOffset = lastModel.text?.length || 0;
    const nextSiblingModel = page.getNextSibling(lastModel);
    lastModel.text?.join(nextSiblingModel?.text as Text);
    assertExists(nextSiblingModel);
    page.deleteBlock(nextSiblingModel);

    getRichTextByModel(lastModel)?.quill.setSelection(rangeOffset, 0);
  } else {
    if (lastModel?.text) {
      getRichTextByModel(lastModel)?.quill.setSelection(
        lastModel.text?.length,
        0
      );
    } else {
      // TODO: set embed block selection
    }
  }
};

// TODO: used old code, need optimize
export const addBlocks = (
  page: Page,
  blocks: OpenBlockInfo[],
  parent: BaseBlockModel,
  index: number
) => {
  const addedBlockIds = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockProps = {
      flavour: block.flavour as string,
      type: block.type as string,
      checked: block.checked,
      sourceId: block.sourceId,
      caption: block.caption,
      width: block.width,
      height: block.height,
      language: block.language,
    };
    const id = page.addBlock(blockProps, parent, index + i);
    addedBlockIds.push(id);
    const model = page.getBlockById(id);

    const flavour = model?.flavour;
    const initialProps = flavour && page.getInitialPropsMapByFlavour(flavour);
    if (initialProps && initialProps.text instanceof Text) {
      block.text && model?.text?.applyDelta(block.text);
    }

    model && block.children && addBlocks(page, block.children, model, 0);
  }
  return addedBlockIds;
};
