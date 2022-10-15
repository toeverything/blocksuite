import { BaseBlockModel } from '@blocksuite/store';
import { commonTextActiveHandler } from './operations';
import {
  getBlockElementByModel,
  getSelectionByModel,
  getContainerByModel,
  getPreviousBlock,
  getNextBlock,
} from './query';
import { SelectionPosition } from './types';
import type { SelectionManager } from '../..';

function activateRichText(selection: SelectionManager, model: BaseBlockModel) {
  const element = getBlockElementByModel(model);
  const editableContainer = element.querySelector('[contenteditable]');
  if (editableContainer) {
    commonTextActiveHandler(selection.lastSelectionPosition, editableContainer);
  }
}

export function activatePreviousBlock(
  model: BaseBlockModel,
  position?: SelectionPosition
) {
  const selection = getSelectionByModel(model);
  const container = getContainerByModel(model);

  let nextPosition = position;
  if (nextPosition) {
    selection.lastSelectionPosition = nextPosition;
  } else if (selection.lastSelectionPosition) {
    nextPosition = selection.lastSelectionPosition;
  }
  const preNodeModel = getPreviousBlock(container, model.id);
  if (preNodeModel) {
    activateRichText(selection, preNodeModel);
  }
}

export function activateNextBlock(
  model: BaseBlockModel,
  position: SelectionPosition = 'start'
) {
  const selection = getSelectionByModel(model);
  // const container = getContainerByModel(model);

  let nextPosition = position;
  if (nextPosition) {
    selection.lastSelectionPosition = nextPosition;
  } else if (selection.lastSelectionPosition) {
    nextPosition = selection.lastSelectionPosition;
  }
  const nextNodeModel = getNextBlock(model.id);
  if (nextNodeModel) {
    activateRichText(selection, nextNodeModel);
  }
}
