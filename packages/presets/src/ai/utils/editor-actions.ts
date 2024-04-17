import type {
  BlockElement,
  EditorHost,
  TextSelection,
} from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { insertFromMarkdown, markdownToSnapshot } from './markdown-utils.js';

const setBlockSelection = (
  host: EditorHost,
  parent: BlockElement,
  models: BlockModel[]
) => {
  const parentPath = parent.path;
  const selections = models
    .map(model => [...parentPath, model.id])
    .map(path => host.selection.create('block', { path }));
  host.selection.setGroup('note', selections);
};

export const insertBelow = async (
  host: EditorHost,
  content: string,
  selectBlock: BlockElement
) => {
  const blockParent = selectBlock.parentBlockElement;
  const index = blockParent.model.children.findIndex(
    model => model.id === selectBlock.model.id
  );

  const models = await insertFromMarkdown(
    host,
    content,
    blockParent.model.id,
    index + 1
  );
  await host.updateComplete;
  setBlockSelection(host, blockParent, models);
};

export const replace = async (
  host: EditorHost,
  content: string,
  firstBlock: BlockElement,
  selectedModels: BlockModel[],
  textSelection?: TextSelection
) => {
  const firstBlockParent = firstBlock.parentBlockElement;
  const firstIndex = firstBlockParent.model.children.findIndex(
    model => model.id === firstBlock.model.id
  );

  if (textSelection) {
    const { snapshot, job } = await markdownToSnapshot(content, host);
    await job.snapshotToSlice(
      snapshot,
      host.doc,
      firstBlockParent.model.id,
      firstIndex + 1
    );
  } else {
    selectedModels.forEach(model => {
      host.doc.deleteBlock(model);
    });

    const models = await insertFromMarkdown(
      host,
      content,
      firstBlockParent.model.id,
      firstIndex
    );

    await host.updateComplete;
    setBlockSelection(host, firstBlockParent, models);
  }
};
