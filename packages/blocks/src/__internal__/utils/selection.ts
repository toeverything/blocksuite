import { BaseBlockModel } from '@blocksuite/store';
import { commonTextActiveHandler } from './operations';
import {
  getBlockElementByModel,
  getDefaultPageBlock,
  getContainerByModel,
  getPreviousBlock,
  getNextBlock,
} from './query';
import { SelectionPosition } from './types';

function activateRichText(position: SelectionPosition, model: BaseBlockModel) {
  const element = getBlockElementByModel(model);
  const editableContainer = element.querySelector('[contenteditable]');
  if (editableContainer) {
    commonTextActiveHandler(position, editableContainer);
  }
}

export function activatePreviousBlock(
  model: BaseBlockModel,
  position?: SelectionPosition
) {
  const page = getDefaultPageBlock(model);
  const container = getContainerByModel(model);

  let nextPosition = position;
  if (nextPosition) {
    page.lastSelectionPosition = nextPosition;
  } else if (page.lastSelectionPosition) {
    nextPosition = page.lastSelectionPosition;
  }

  const preNodeModel = getPreviousBlock(container, model.id);
  if (preNodeModel && nextPosition) {
    activateRichText(nextPosition, preNodeModel);
  }
}

export function activateNextBlock(
  model: BaseBlockModel,
  position: SelectionPosition = 'start'
) {
  const page = getDefaultPageBlock(model);
  // const container = getContainerByModel(model);

  let nextPosition = position;
  if (nextPosition) {
    page.lastSelectionPosition = nextPosition;
  } else if (page.lastSelectionPosition) {
    nextPosition = page.lastSelectionPosition;
  }
  const nextNodeModel = getNextBlock(model.id);
  if (nextNodeModel) {
    activateRichText(nextPosition, nextNodeModel);
  }
}
