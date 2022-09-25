import type { BaseBlockModel, Store } from '@blocksuite/store';

// XXX: workaround quill lifecycle issue
function asyncFocusRichText(store: Store, id: string) {
  setTimeout(() => store.richTextAdapters.get(id)?.quill.focus());
}

export function handleBlockEndEnter(store: Store, model: BaseBlockModel) {
  const parent = store.getParent(model);
  const index = parent?.children.indexOf(model);
  if (parent && index !== undefined && index > -1) {
    // make adding text block by enter a standalone operation
    store.captureSync();

    const blockProps = {
      flavour: model.flavour,
      text: '',
    };
    const id = store.addBlock(blockProps, parent, index + 1);
    asyncFocusRichText(store, id);
  }
}

export function handleIndent(store: Store, model: BaseBlockModel) {
  const previousSibling = store.getPreviousSibling(model);
  if (previousSibling) {
    store.captureSync();
    store.deleteBlock(model);
    store.addBlock(model, previousSibling);
  }
}

export function handleUnindent(store: Store, model: BaseBlockModel) {
  const parent = store.getParent(model);
  if (!parent) return;

  const grandParent = store.getParent(parent);
  if (!grandParent) return;

  const index = grandParent.children.indexOf(parent);
  store.captureSync();
  store.deleteBlock(model);
  store.addBlock(model, grandParent, index + 1);
}
