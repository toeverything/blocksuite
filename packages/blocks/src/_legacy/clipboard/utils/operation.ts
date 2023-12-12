import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';

import { getInlineEditorByModel } from '../../../_common/utils/query.js';
import { getSelectedContentModels } from '../../../page-block/utils/selection.js';

export function deleteModelsByTextSelection(
  host: EditorHost,
  textSelection = host.selection.find('text')
) {
  assertExists(textSelection);
  const page = host.page;
  const selectedModels = getSelectedContentModels(host, ['text']);

  if (selectedModels.length === 0) {
    return null;
  }

  const startModel = selectedModels[0];
  const endModel = selectedModels[selectedModels.length - 1];
  // TODO handle database
  if (!startModel.text || !endModel.text) {
    throw new Error('startModel or endModel does not have text');
  }

  const inlineEditor = getInlineEditorByModel(startModel);
  assertExists(inlineEditor);

  // Only select one block
  if (startModel === endModel) {
    page.captureSync();
    if (textSelection.from.index > 0 && textSelection.isCollapsed()) {
      return startModel;
    }
    startModel.text.delete(textSelection.from.index, textSelection.from.length);
    inlineEditor.setInlineRange({
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

  inlineEditor.setInlineRange({
    index: textSelection.from.index,
    length: 0,
  });
  return startModel;
}
