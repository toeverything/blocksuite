import type { TextRangePoint } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import { handleBlockSplit } from '../rich-text/rich-text-operations.js';
import {
  asyncGetVirgoByModel,
  getPageBlock,
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
  const isSinglePastedBlock = pastedBlocks.length === 1;
  const isFocusedBlockEmpty =
    !focusedBlockModel.text?.length && !convertToPastedIfEmpty;
  const shouldMergeFirstBlock =
    !isFocusedBlockEmpty &&
    firstBlock.text &&
    (textRangePoint.index > 0 ||
      (firstBlock.children.length === 0 && isSinglePastedBlock));
  const parent = page.getParent(focusedBlockModel);
  assertExists(parent);

  let lastItemMergedIds: string[] = [];
  let splitSuffixModel: BaseBlockModel | null = null;
  /**
   * we should record focused block's children before change,
   * it will move to correct position later
   */
  const focusedBlockChildrenBeforeChange = [...focusedBlockModel.children];

  /**
   * check if split need, it only should split on the caret between in focused block,
   * and there are multiple pasted blocks or single nested pasted block
   */
  if (
    !isFocusedBlockEmpty &&
    textRangePoint.index > 0 &&
    Number(focusedBlockModel.text?.length) > textRangePoint.index &&
    (!isSinglePastedBlock || firstBlock.children.length > 0)
  ) {
    await handleBlockSplit(page, focusedBlockModel, textRangePoint.index, 0);
    splitSuffixModel = page.getNextSibling(focusedBlockModel);
  }

  if (shouldMergeFirstBlock) {
    focusedBlockModel.text?.insertList(
      firstBlock.text || [],
      textRangePoint.index || 0
    );

    lastItemMergedIds = await addSerializedBlocks(
      page,
      firstBlock.children || [],
      focusedBlockModel,
      0
    );
  }

  const remainingPastedBlocks = pastedBlocks.slice(
    shouldMergeFirstBlock ? 1 : 0
  );

  if (remainingPastedBlocks.length > 0) {
    const insertPosition =
      parent.children.indexOf(focusedBlockModel) +
      (shouldMergeFirstBlock ? 1 : 0);

    lastItemMergedIds = await addSerializedBlocks(
      page,
      remainingPastedBlocks,
      parent,
      insertPosition
    );

    const lastBlock = pastedBlocks.at(-1);
    if (lastBlock?.flavour === 'affine:image' && isFocusedBlockEmpty) {
      const id = page.addBlock(
        'affine:paragraph',
        { type: 'text' },
        parent,
        insertPosition + remainingPastedBlocks.length
      );
      lastItemMergedIds = [id];
    }
  }

  // move focused block's children to correct position
  if (focusedBlockChildrenBeforeChange.length) {
    if (isSinglePastedBlock && splitSuffixModel) {
      page.updateBlock(focusedBlockModel, {
        children: focusedBlockModel.children.concat(
          focusedBlockChildrenBeforeChange
        ),
      });
    } else if (
      (shouldMergeFirstBlock && !isSinglePastedBlock) ||
      splitSuffixModel
    ) {
      // move only after merged first block or handled split block
      page.updateBlock(focusedBlockModel, {
        children: focusedBlockModel.children.slice(
          0,
          firstBlock.children.length
        ),
      });
      const focusedBlockModelSiblings = page.getNextSiblings(focusedBlockModel);
      const lastSiblingIndex = remainingPastedBlocks.length - 1;
      const lastSibling = focusedBlockModelSiblings.at(lastSiblingIndex);

      if (lastSibling) {
        page.updateBlock(lastSibling, {
          children: lastSibling.children.concat(
            focusedBlockChildrenBeforeChange
          ),
        });
      }
    }
  }

  const lastMergedModel = page.getBlockById(lastItemMergedIds.at(-1)!);
  const lastMergedModelRangeIndex = lastMergedModel?.text?.length ?? 0;

  if (splitSuffixModel) {
    // if split suffix model exit, there must be an merged block
    assertExists(lastMergedModel);

    lastMergedModel.text?.join(splitSuffixModel.text as Text);
    page.deleteBlock(splitSuffixModel);
  }

  /**
   * Finally, wo should handle the caret, there are 3 cases.
   * for 1, it should on focused block's start.
   * for 2, it should in focused block's middle or on focused block's end,
   *        where the first block inserted text's end.
   * for 3. it should on last merged block's end.
   */
  if (
    textRangePoint.index === 0 &&
    !isFocusedBlockEmpty &&
    !shouldMergeFirstBlock &&
    (!isSinglePastedBlock || firstBlock.children.length > 0)
  ) {
    setRange(focusedBlockModel, {
      index: textRangePoint.index,
      length: 0,
    });
    return;
  }
  if (
    !isFocusedBlockEmpty &&
    isSinglePastedBlock &&
    firstBlock.children.length === 0
  ) {
    const textLength =
      firstBlock?.text?.reduce((sum, data) => {
        return sum + (data.insert?.length || 0);
      }, 0) ?? 0;
    setRange(focusedBlockModel, {
      index: (textRangePoint.index ?? 0) + textLength,
      length: 0,
    });
    return;
  }

  if (lastMergedModel?.text) {
    requestAnimationFrame(() => {
      lastMergedModel &&
        setRange(lastMergedModel, {
          index: lastMergedModelRangeIndex || 0,
          length: 0,
        });
    });
  } else {
    requestAnimationFrame(() => {
      if (lastMergedModel) {
        const lastMergedBlock = getPageBlock(lastMergedModel);
        if (!lastMergedBlock) {
          return;
        }
        const selectionManager = lastMergedBlock.root.selectionManager;
        const blockSelection = selectionManager?.getInstance('block', {
          path: lastMergedBlock.path ?? [],
        });
        selectionManager.set([blockSelection]);
      }
    });
  }

  if (isFocusedBlockEmpty && !shouldMergeFirstBlock) {
    page.deleteBlock(focusedBlockModel);
  }
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
