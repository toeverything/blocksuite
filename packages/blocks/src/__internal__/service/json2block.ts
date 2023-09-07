import type { TextRangePoint } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import { handleBlockSplit } from '../rich-text/rich-text-operations.js';
import {
  asyncGetVirgoByModel,
  focusBlockByModel,
  type SerializedBlock,
} from '../utils/index.js';
import type { BlockModels } from '../utils/model.js';
import { getService } from './singleton.js';

export async function json2block(
  focusedBlockModel: BaseBlockModel,
  pastedBlocks: SerializedBlock[],
  options?: {
    convertToPastedIfEmpty?: boolean;
    textRangePoint?: TextRangePoint;
  }
) {
  const { convertToPastedIfEmpty = false, textRangePoint } = options ?? {};

  assertExists(textRangePoint);

  const { page } = focusedBlockModel;
  // After deleteModelsByRange, selected block is must only, and selection is must caret
  const firstBlock = pastedBlocks[0];
  const isFocusedBlockEmpty =
    !focusedBlockModel.text?.length && !convertToPastedIfEmpty;
  const shouldMergeFirstBlock =
    !isFocusedBlockEmpty && firstBlock.text && focusedBlockModel.text;
  let shouldMergeLastBlock = focusedBlockModel.children.length > 0;
  const parent = page.getParent(focusedBlockModel);
  assertExists(parent);

  let ids: string[] = [];
  let splitPostModel: BaseBlockModel | null = null;

  if (
    focusedBlockModel.text?.length !==
      textRangePoint.index + textRangePoint.length &&
    (pastedBlocks.length > 1 || firstBlock.children.length > 0)
  ) {
    await handleBlockSplit(page, focusedBlockModel, textRangePoint.index, 0);
    splitPostModel = page.getNextSibling(focusedBlockModel);
    shouldMergeLastBlock = true;
  }
  if (shouldMergeFirstBlock) {
    focusedBlockModel.text?.insertList(
      firstBlock.text || [],
      textRangePoint.index || 0
    );

    ids = await addSerializedBlocks(
      page,
      firstBlock.children || [],
      focusedBlockModel,
      0
    );
  }

  const remainingPastedBlocks = pastedBlocks.slice(
    shouldMergeFirstBlock ? 1 : 0
  );

  // paste multiple blocks.
  if (remainingPastedBlocks.length > 0) {
    if (shouldMergeFirstBlock && focusedBlockModel.flavour === 'affine:list') {
      ids = await addSerializedBlocks(
        page,
        remainingPastedBlocks,
        focusedBlockModel,
        focusedBlockModel.children.length - 1
      );
    } else {
      const insertPosition =
        parent.children.indexOf(focusedBlockModel) +
        (shouldMergeFirstBlock ? 1 : 0);

      ids = await addSerializedBlocks(
        page,
        remainingPastedBlocks,
        parent,
        insertPosition
      );
    }
  }

  if (ids.length === 0) {
    const textLength =
      firstBlock?.text?.reduce((sum, data) => {
        return sum + (data.insert?.length || 0);
      }, 0) ?? 0;
    await setRange(focusedBlockModel, {
      index: (textRangePoint.index ?? 0) + textLength,
      length: 0,
    });
    return;
  }
  const lastModel = page.getBlockById(ids[ids.length - 1]);
  assertExists(lastModel);

  if (shouldMergeLastBlock) {
    const nextSiblingModel = splitPostModel || page.getNextSibling(lastModel);
    console.log(nextSiblingModel);
    if (nextSiblingModel) {
      lastModel.text?.join(nextSiblingModel?.text as Text);
      if (
        splitPostModel &&
        splitPostModel.children.length > 0 &&
        focusedBlockModel
      ) {
        page.updateBlock(focusedBlockModel, {
          children: focusedBlockModel.children.concat(
            ...splitPostModel.children
          ),
        });
      }
      page.deleteBlock(nextSiblingModel);
    }

    // Wait for the block's rich text mounted
    const rangeOffset = lastModel.text?.length || 0;
    requestAnimationFrame(() => {
      setRange(lastModel, {
        index: rangeOffset,
        length: 0,
      });
    });
  } else {
    if (lastModel?.text) {
      const rangIndex = lastModel.text.length;
      requestAnimationFrame(() => {
        setRange(lastModel, {
          index: rangIndex,
          length: 0,
        });
      });
    } else {
      requestAnimationFrame(() => {
        // TODO: wait block ready
        focusBlockByModel(lastModel);
      });
    }
  }

  isFocusedBlockEmpty && page.deleteBlock(focusedBlockModel);
}

async function setRange(model: BaseBlockModel, vRange: VRange) {
  const vEditor = await asyncGetVirgoByModel(model);
  if (!vEditor) {
    return;
  }

  vEditor.setVRange(vRange);
  // mount new dom range in this trick
  vEditor.syncVRange();
}

export async function addSerializedBlocks(
  page: Page,
  serializedBlocks: SerializedBlock[],
  parent: BaseBlockModel,
  index: number
) {
  const addedBlockIds: string[] = [];
  const pendingModels: { model: BaseBlockModel; json: SerializedBlock }[] = [];

  for (let i = 0; i < serializedBlocks.length; i++) {
    const json = serializedBlocks[i];
    const flavour = json.flavour as keyof BlockModels;
    // XXX: block props should not be written here !!!
    const {
      // Omit block props
      children,
      text,
      rawText,
      databaseProps,
      xywh,

      ...blockPropsJson
    } = json;

    const blockProps = {
      ...blockPropsJson,
      title: json.databaseProps?.title || json.title,
    };

    let id: string;
    try {
      page.schema.validate(flavour, parent.flavour);
      if (flavour === 'affine:database') {
        id = page.addBlock(
          flavour,
          {
            ...blockProps,
            title:
              typeof databaseProps?.title === 'string'
                ? new Text(databaseProps.title)
                : databaseProps?.title,
            views: databaseProps?.views,
          },
          parent,
          index + i
        );
      } else {
        id = page.addBlock(flavour, blockProps, parent, index + i);
      }
    } catch {
      id = page.addBlock(
        'affine:paragraph',
        { type: 'text' },
        parent,
        index + i
      );
    }

    addedBlockIds.push(id);
    const model = page.getBlockById(id);
    assertExists(model);

    const initialProps =
      model?.flavour && page.getInitialPropsByFlavour(model?.flavour);
    if (initialProps && initialProps.text instanceof Text) {
      json.text && model?.text?.applyDelta(json.text);
    }

    if (model && json.children.length) {
      const ids = await addSerializedBlocks(page, json.children, model, 0);
      addedBlockIds.push(...ids);
      pendingModels.push({ model, json });
    }
  }

  for (const { model, json } of pendingModels) {
    const flavour = model.flavour as keyof BlockModels;
    const service = getService(flavour);
    service.onBlockPasted(model, {
      views: json.databaseProps?.views,
      rowIds: json.databaseProps?.rowIds,
      cells: json.databaseProps?.cells,
      columns: json.databaseProps?.columns,
    });
  }

  return addedBlockIds;
}
