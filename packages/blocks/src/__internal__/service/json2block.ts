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
  const lastBlock = pastedBlocks[pastedBlocks.length - 1];
  const isFocusedBlockEmpty =
    !focusedBlockModel.text?.length && !convertToPastedIfEmpty;
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

    const shouldSplitBlock =
      focusedBlockModel.text?.length !==
      textRangePoint.index + textRangePoint.length;

    shouldSplitBlock &&
      (await handleBlockSplit(
        page,
        focusedBlockModel,
        textRangePoint.index,
        0
      ));

    if (shouldMergeFirstBlock) {
      focusedBlockModel.text?.insertList(
        firstBlock.text || [],
        textRangePoint.index || 0
      );

      await addSerializedBlocks(
        page,
        firstBlock.children || [],
        focusedBlockModel,
        0
      );

      await setRange(focusedBlockModel, {
        index: (textRangePoint.index ?? 0) + textLength,
        length: 0,
      });
    } else {
      const [id] = await addSerializedBlocks(
        page,
        pastedBlocks,
        parent,
        parent.children.indexOf(focusedBlockModel) + 1
      );

      const model = page.getBlockById(id);

      assertExists(model);
      if (model.text) {
        await setRange(model, {
          index: textLength,
          length: 0,
        });
      }
    }

    isFocusedBlockEmpty && page.deleteBlock(focusedBlockModel);
    return;
  }

  await handleBlockSplit(page, focusedBlockModel, textRangePoint.index, 0);

  if (shouldMergeFirstBlock) {
    focusedBlockModel.text?.insertList(
      firstBlock.text || [],
      textRangePoint.index || 0
    );
    await addSerializedBlocks(
      page,
      firstBlock.children || [],
      focusedBlockModel,
      0
    );
  }

  const insertPosition =
    parent.children.indexOf(focusedBlockModel) +
    (shouldMergeFirstBlock ? 1 : 0);

  const ids = await addSerializedBlocks(
    page,
    pastedBlocks.slice(shouldMergeFirstBlock ? 1 : 0),
    parent,
    insertPosition
  );

  isFocusedBlockEmpty && page.deleteBlock(focusedBlockModel);

  const lastModel = page.getBlockById(ids[ids.length - 1]);
  assertExists(lastModel);

  if (shouldMergeLastBlock) {
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
      requestAnimationFrame(() => {
        // TODO: wait block ready
        focusBlockByModel(lastModel);
      });
    }
  }
}

async function setRange(model: BaseBlockModel, vRange: VRange) {
  const vEditor = await asyncGetVirgoByModel(model);
  assertExists(vEditor);
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
      await addSerializedBlocks(page, json.children, model, 0);
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
