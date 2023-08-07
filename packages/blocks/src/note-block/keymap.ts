import type { BlockElement } from '@blocksuite/lit';

const getSelection = (blockComponent: BlockElement) =>
  blockComponent.root.selectionManager;
const getView = (blockComponent: BlockElement) => blockComponent.root.viewStore;

const getNextSibling = (blockElement: BlockElement) => {
  const view = getView(blockElement);
  const nextView = view.findNext(blockElement.path, node => {
    if (node.type !== 'block' || node.view.contains(blockElement)) {
      return;
    }
    return true;
  });
  if (!nextView) return null;
  return view.viewFromPath('block', nextView.path);
};

const getPrevSibling = (blockElement: BlockElement) => {
  const view = getView(blockElement);
  const nextView = view.findPrev(blockElement.path, node => {
    if (node.type !== 'block') {
      return;
    }
    return true;
  });
  if (!nextView) return null;
  return view.viewFromPath('block', nextView.path);
};

const getLastGrandChild = (blockElement: BlockElement) => {
  const view = getView(blockElement);
  let output = blockElement;
  view.walkThrough((node, index, parent) => {
    if (
      node.children.filter(n => n.type === 'block').length === 0 &&
      parent.children.filter(n => n.type === 'block').at(-1) === node
    ) {
      output = node.view as BlockElement;
      return true;
    }
    return;
  }, blockElement.path);
  return output;
};

const setBlockSelection = (blockElement: BlockElement) => {
  const selection = getSelection(blockElement);
  const path = blockElement.path;
  selection.update(selList => {
    return selList
      .filter(sel => !sel.is('text') && !sel.is('block'))
      .concat(selection.getInstance('block', { path }));
  });
};

const selectNextBlock = (blockElement: BlockElement) => {
  const view = getView(blockElement);
  const selection = getSelection(blockElement);
  const selections = selection.value;
  const focus = selections.at(-1);
  if (!focus) return;

  const focusBlock = view.viewFromPath('block', focus.path);
  if (!focusBlock) return;

  let next: BlockElement | null = null;
  if (focusBlock.childBlockElements[0]) {
    next = focusBlock.childBlockElements[0];
  }

  if (!next) {
    next = getNextSibling(focusBlock);
  }

  if (next && next.model.flavour !== blockElement.model.flavour) {
    setBlockSelection(next);

    return true;
  }

  return;
};

const selectPrevBlock = (blockElement: BlockElement) => {
  const view = getView(blockElement);
  const selection = getSelection(blockElement);
  const selections = selection.value;
  const focus = selections.at(0);
  if (!focus) return;

  const focusBlock = view.viewFromPath('block', focus.path);
  if (!focusBlock) return;

  let prev: BlockElement | null = getPrevSibling(focusBlock);

  if (!prev) {
    return;
  }

  if (!prev.contains(focusBlock)) {
    prev = getLastGrandChild(prev);
  }

  if (prev && prev !== blockElement) {
    setBlockSelection(prev);

    return true;
  }

  return;
};

export const bindHotKey = (blockElement: BlockElement) => {
  blockElement.bindHotKey({
    ArrowDown: () => {
      return selectNextBlock(blockElement);
    },
    ArrowUp: () => {
      return selectPrevBlock(blockElement);
    },
  });
};
