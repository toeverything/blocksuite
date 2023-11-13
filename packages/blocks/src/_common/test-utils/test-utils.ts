import { updateBlockElementType } from '../../page-block/utils/operations/element/block-level.js';
import {
  mergeToCodeModel,
  transformModel,
} from '../../page-block/utils/operations/model.js';
import { getSelectedContentModels } from '../../page-block/utils/selection.js';

class PageTestUtils {
  // block element operations (ui layer)
  updateBlockElementType = updateBlockElementType;

  // block model operations (data layer)
  mergeToCodeModel = mergeToCodeModel;
  transformModel = transformModel;

  // selection
  getSelectedContentModels = getSelectedContentModels;
}

export class TestUtils {
  pageBlock = new PageTestUtils();
}
