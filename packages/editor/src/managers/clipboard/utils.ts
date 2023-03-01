import {
  DomSelectionType,
  getDefaultPageBlock,
  getModelByElement,
  getModelsByRange,
  getVRangeByNode,
  SelectionUtils,
} from '@blocksuite/blocks';
import type { Page } from '@blocksuite/store';
import { assertExists, BaseBlockModel } from '@blocksuite/store';

import type { SelectedBlock, SelectionInfo } from './types.js';

function getSelectedBlock(models: BaseBlockModel[]): SelectedBlock[] {
  const result = [];
  const parentMap = new Map<string, SelectedBlock>();
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const parent = model.page.getParent(model);
    const block = { id: model.id, children: [] };
    if (!parent || !parentMap.has(parent.id)) {
      result.push(block);
    } else {
      parentMap.get(parent.id)?.children.push(block);
    }
    parentMap.set(model.id, block);
  }
  return result;
}

function getLastSelectBlock(blocks: SelectedBlock[]): SelectedBlock | null {
  if (blocks.length === 0) {
    return null;
  }
  const last = blocks[blocks.length - 1];
  if (last.children.length === 0) {
    return last;
  }
  return getLastSelectBlock(last.children);
}

/**
 * @deprecated Use `getCurrentBlockRange` instead,
 */
export function getSelectInfo(page: Page): SelectionInfo {
  if (!page.root) {
    return {
      type: 'None',
      selectedBlocks: [],
    };
  }

  let type: SelectionInfo['type'] = 'None';
  let selectedBlocks: SelectedBlock[] = [];
  let selectedModels: BaseBlockModel[] = [];
  const pageBlock = getDefaultPageBlock(page.root);
  // FIXME: missing selection in edgeless mode
  const state = pageBlock.selection?.state;
  const nativeSelection = window.getSelection();
  if (state?.type === 'block') {
    type = 'Block';
    const { selectedBlocks } = state;
    selectedModels = selectedBlocks.map(block => getModelByElement(block));
  } else if (nativeSelection && nativeSelection.type !== 'None') {
    type = nativeSelection.type as DomSelectionType;
    selectedModels = getModelsByRange(SelectionUtils.getCurrentNativeRange());
  }
  if (type !== 'None') {
    selectedBlocks = getSelectedBlock(selectedModels);
    if (type !== 'Block' && nativeSelection && selectedBlocks.length > 0) {
      const range = nativeSelection.getRangeAt(0);
      const firstVRange = getVRangeByNode(range.startContainer);
      const endVRange = getVRangeByNode(range.endContainer);
      assertExists(firstVRange);
      assertExists(endVRange);
      const firstIndex = firstVRange.index;
      const endIndex = endVRange.index + endVRange.length;
      selectedBlocks[0].startPos = firstIndex;
      const lastBlock = getLastSelectBlock(selectedBlocks);
      if (lastBlock) {
        lastBlock.endPos = endIndex;
      }
    }
  }
  return {
    type,
    selectedBlocks,
  };
}
