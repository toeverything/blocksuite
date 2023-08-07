import type { PageBlockComponent } from '../types.js';
import { updateBlockElementType } from './operations/block-element.js';
import { mergeToCodeBlocks, transformBlock } from './operations/model.js';
import {
  getSelectedContentBlockElements,
  getSelectedContentModels,
} from './selection.js';

/**
 * Used to wrap utils in PageBlockComponent, which will
 * make us more convenient to write test.
 */
export class UtilManager {
  constructor(public pageElement: PageBlockComponent) {}

  // block element operations (ui layer)
  updateBlockElementType = updateBlockElementType;

  // block model operations (data layer)
  mergeToCodeBlocks = mergeToCodeBlocks;
  transformBlock = transformBlock;

  // selection
  getSelectedContentModels = getSelectedContentModels;
  getSelectedContentBlockElements = getSelectedContentBlockElements;
}
