import { updateBlockElementType } from '../page-block/utils/operations/block-element.js';
import {
  mergeToCodeBlocks,
  transformBlock,
} from '../page-block/utils/operations/model.js';
import {
  getSelectedContentBlockElements,
  getSelectedContentModels,
} from '../page-block/utils/selection.js';

export class PageTestUtils {
  // block element operations (ui layer)
  updateBlockElementType = updateBlockElementType;

  // block model operations (data layer)
  mergeToCodeBlocks = mergeToCodeBlocks;
  transformBlock = transformBlock;

  // selection
  getSelectedContentModels = getSelectedContentModels;
  getSelectedContentBlockElements = getSelectedContentBlockElements;
}
