import type {
  BlockComponent,
  EditorHost,
  TextSelection,
} from '@blocksuite/block-std';
import type { AffineAIPanelWidget } from '@blocksuite/blocks';

import { findNoteBlockModel, isInsideEdgelessEditor } from '@blocksuite/blocks';
import { type BlockModel, Slice } from '@blocksuite/store';

import {
  insertFromMarkdown,
  markDownToDoc,
  markdownToSnapshot,
} from './markdown-utils.js';

const setBlockSelection = (
  host: EditorHost,
  parent: BlockComponent,
  models: BlockModel[]
) => {
  const selections = models
    .map(model => model.id)
    .map(blockId => host.selection.create('block', { blockId }));

  if (isInsideEdgelessEditor(host)) {
    const noteModel = findNoteBlockModel(parent.model);
    if (!noteModel) return;
    const surfaceElementId = noteModel.id;
    const surfaceSelection = host.selection.create(
      'surface',
      selections[0].blockId,
      [surfaceElementId],
      true
    );

    selections.push(surfaceSelection);
    host.selection.set(selections);
  } else {
    host.selection.setGroup('note', selections);
  }
};

export const insert = async (
  host: EditorHost,
  content: string,
  selectBlock: BlockComponent,
  below: boolean = true
) => {
  const parentModel = selectBlock.model.parent;
  const parentComponent = selectBlock.parentComponent;
  if (!parentModel || !parentComponent) return;
  const index = parentModel.children.findIndex(
    model => model.id === selectBlock.model.id
  );
  const insertIndex = below ? index + 1 : index;

  const models = await insertFromMarkdown(
    host,
    content,
    parentModel.id,
    insertIndex
  );
  await host.updateComplete;
  requestAnimationFrame(() => setBlockSelection(host, parentComponent, models));
};

export const insertBelow = async (
  host: EditorHost,
  content: string,
  selectBlock: BlockComponent
) => {
  await insert(host, content, selectBlock, true);
};

export const insertAbove = async (
  host: EditorHost,
  content: string,
  selectBlock: BlockComponent
) => {
  await insert(host, content, selectBlock, false);
};

export const replace = async (
  host: EditorHost,
  content: string,
  firstBlock: BlockComponent,
  selectedModels: BlockModel[],
  textSelection?: TextSelection
) => {
  const parentModel = firstBlock.model.parent;
  const parentComponent = firstBlock.parentComponent;
  if (!parentModel || !parentComponent) return;
  const firstIndex = parentModel.children.findIndex(
    model => model.id === firstBlock.model.id
  );

  if (textSelection) {
    const { snapshot, job } = await markdownToSnapshot(content, host);
    await job.snapshotToSlice(
      snapshot,
      host.doc,
      parentModel.id,
      firstIndex + 1
    );
  } else {
    selectedModels.forEach(model => {
      host.doc.deleteBlock(model);
    });

    const models = await insertFromMarkdown(
      host,
      content,
      parentModel.id,
      firstIndex
    );

    await host.updateComplete;
    requestAnimationFrame(() =>
      setBlockSelection(host, parentComponent, models)
    );
  }
};

export const copyTextAnswer = async (panel: AffineAIPanelWidget) => {
  const host = panel.host;
  if (!panel.answer) {
    return false;
  }
  return copyText(host, panel.answer);
};

export const copyText = async (host: EditorHost, text: string) => {
  const previewDoc = await markDownToDoc(host, text);
  const models = previewDoc
    .getBlocksByFlavour('affine:note')
    .map(b => b.model)
    .flatMap(model => model.children);
  const slice = Slice.fromModels(previewDoc, models);
  await host.std.clipboard.copySlice(slice);
  const { notificationService } = host.std.spec.getService('affine:page');
  if (notificationService) {
    notificationService.toast('Copied to clipboard');
  }
  return true;
};
