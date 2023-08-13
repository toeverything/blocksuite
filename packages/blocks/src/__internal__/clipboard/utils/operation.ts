import type { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { PageBlockComponent } from '../../../page-block/index.js';
import {
  getSelectedContentModels,
  getTextSelection,
} from '../../../page-block/utils/selection.js';
import { getVirgoByModel } from '../../utils/query.js';

export function deleteModelsByTextSelection(
  pageElement: PageBlockComponent,
  textSelection?: TextSelection
) {
  if (!textSelection) {
    textSelection = getTextSelection(pageElement) ?? undefined;
  }
  assertExists(textSelection);

  const page = pageElement.page;
  const selectedModels = getSelectedContentModels(pageElement, ['text']);

  if (selectedModels.length === 0) {
    return null;
  }

  const startModel = selectedModels[0];
  const endModel = selectedModels[selectedModels.length - 1];
  // TODO handle database
  if (!startModel.text || !endModel.text) {
    throw new Error('startModel or endModel does not have text');
  }

  const vEditor = getVirgoByModel(startModel);
  assertExists(vEditor);

  // Only select one block
  if (startModel === endModel) {
    page.captureSync();
    if (textSelection.from.index > 0 && textSelection.isCollapsed()) {
      // startModel.text.delete(blockRange.startOffset - 1, 1);
      // vEditor.setVRange({
      //   index: blockRange.startOffset - 1,
      //   length: 0,
      // });
      return startModel;
    }
    startModel.text.delete(textSelection.from.index, textSelection.from.length);
    vEditor.setVRange({
      index: textSelection.from.index,
      length: 0,
    });
    return startModel;
  }
  page.captureSync();
  startModel.text.delete(textSelection.from.index, textSelection.from.length);
  endModel.text.delete(
    textSelection.to?.index ?? 0,
    textSelection.to?.length ?? 0
  );
  startModel.text.join(endModel.text);
  selectedModels.slice(1).forEach(model => {
    page.deleteBlock(model);
  });

  vEditor.setVRange({
    index: textSelection.from.index,
    length: 0,
  });
  return startModel;
}
