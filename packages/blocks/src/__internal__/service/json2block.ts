import type { BlockModels } from '@blocksuite/global/types';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import { handleBlockSplit } from '../rich-text/rich-text-operations.js';
import { getServiceOrRegister } from '../service.js';
import {
  asyncGetVirgoByModel,
  type BlockRange,
  type SerializedBlock,
} from '../utils/index.js';

export async function json2block(
  focusedBlockModel: BaseBlockModel,
  pastedBlocks: SerializedBlock[],
  options?: {
    convertToPastedIfEmpty?: boolean;
    range?: BlockRange;
  }
) {
  const { convertToPastedIfEmpty = false, range } = options ?? {};

  assertExists(range);

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

    const shouldSplitBlock = focusedBlockModel.text?.length !== range.endOffset;

    shouldSplitBlock &&
      (await handleBlockSplit(page, focusedBlockModel, range.startOffset, 0));

    if (shouldMergeFirstBlock) {
      focusedBlockModel.text?.insertList(
        firstBlock.text || [],
        range?.startOffset || 0
      );

      await addSerializedBlocks(
        page,
        firstBlock.children || [],
        focusedBlockModel,
        0
      );

      await setRange(focusedBlockModel, {
        index: (range?.startOffset ?? 0) + textLength,
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
  const vEditor = await asyncGetVirgoByModel(model);
  assertExists(vEditor);
  vEditor.setVRange(vRange);
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
    const blockProps = {
      flavour,
      type: json.type as string,
      checked: json.checked,
      sourceId: json.sourceId,
      caption: json.caption,
      width: json.width,
      height: json.height,
      language: json.language,
      title: json.databaseProps?.title || json.title,
      titleColumnName: json.databaseProps?.titleColumnName,
      titleColumnWidth: json.databaseProps?.titleColumnWidth,
      // bookmark
      url: json.url,
      description: json.description,
      icon: json.icon,
      image: json.image,
      hasCrawled: json.hasCrawled,
    };
    const id = page.addBlock(flavour, blockProps, parent, index + i);
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
    const service = await getServiceOrRegister(flavour);
    service.onBlockPasted(model, {
      rowIds: json.databaseProps?.rowIds,
      cells: json.databaseProps?.cells,
      columns: json.databaseProps?.columns,
    });
  }

  return addedBlockIds;
}
