import type { BlockSelection } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
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

const getSelectionBySide = (blockElement: BlockElement, tail: boolean) => {
  const selection = getSelection(blockElement);
  const selections = selection.value.filter(sel => sel.is('block'));
  const sel = selections.at(tail ? -1 : 0) as BlockSelection | undefined;
  return sel ?? null;
};

const getAnchorSelection = (blockElement: BlockElement) => {
  const selection = getSelection(blockElement);
  const selections = selection.value.filter(sel => sel.is('block'));
  const sel = selections.find(sel =>
    PathFinder.equals(sel.path, blockElement.path)
  );
  if (!sel) return null;

  return sel;
};

const getNextBlock = (blockElement: BlockElement) => {
  const focus = getAnchorSelection(blockElement);
  if (!focus) return null;

  const view = getView(blockElement);
  const focusBlock = view.viewFromPath('block', focus.path);
  if (!focusBlock) return null;

  let next: BlockElement | null = null;
  if (focusBlock.childBlockElements[0]) {
    next = focusBlock.childBlockElements[0];
  }

  if (!next) {
    next = getNextSibling(focusBlock);
  }

  if (next && !next.contains(focusBlock)) {
    return next;
  }

  return null;
};

const getPrevBlock = (blockElement: BlockElement) => {
  const focus = getAnchorSelection(blockElement);
  if (!focus) return null;

  const view = getView(blockElement);
  const focusBlock = view.viewFromPath('block', focus.path);
  if (!focusBlock) return null;

  let prev: BlockElement | null = getPrevSibling(focusBlock);

  if (!prev) {
    return null;
  }

  if (!prev.contains(focusBlock)) {
    prev = getLastGrandChild(prev);
  }

  if (prev && prev !== blockElement) {
    return prev;
  }

  return null;
};

const selectNextBlock = (blockElement: BlockElement) => {
  const nextBlock = getNextBlock(blockElement);

  if (!nextBlock) {
    return;
  }

  setBlockSelection(nextBlock);

  return true;
};

const selectPrevBlock = (blockElement: BlockElement) => {
  const prevBlock = getPrevBlock(blockElement);

  if (!prevBlock) {
    return;
  }

  setBlockSelection(prevBlock);

  return true;
};

const selectionToBlock = (
  blockElement: BlockElement,
  selection: BlockSelection
) => {
  const view = getView(blockElement);
  return view.viewFromPath('block', selection.path);
};

const selectBetween = (
  anchorBlock: BlockElement,
  focusBlock: BlockElement,
  tail: boolean
) => {
  const selection = getSelection(anchorBlock);
  if (PathFinder.equals(anchorBlock.path, focusBlock.path)) {
    setBlockSelection(focusBlock);
    return;
  }
  const selections = [...selection.value];
  if (selections.every(sel => !PathFinder.equals(sel.path, focusBlock.path))) {
    if (tail) {
      selections.push(
        selection.getInstance('block', { path: focusBlock.path })
      );
    } else {
      selections.unshift(
        selection.getInstance('block', { path: focusBlock.path })
      );
    }
  }

  let start = false;
  const sel = selections.filter(sel => {
    if (
      PathFinder.equals(sel.path, anchorBlock.path) ||
      PathFinder.equals(sel.path, focusBlock.path)
    ) {
      start = !start;
      return true;
    }
    return start;
  });

  selection.update(selList => {
    return selList
      .filter(sel => !sel.is('text') && !sel.is('block'))
      .concat(sel);
  });
};

export const bindHotKey = (blockElement: BlockElement) => {
  let anchorSel: BlockSelection | null = null;
  let focusBlock: BlockElement | null = null;
  const reset = () => {
    anchorSel = null;
    focusBlock = null;
  };

  blockElement.handleEvent('keyDown', ctx => {
    const state = ctx.get('keyboardState');
    if (state.raw.key === 'Shift') {
      return;
    }
    reset();
  });
  blockElement.bindHotKey({
    ArrowDown: () => {
      reset();
      const sel = getSelectionBySide(blockElement, true);
      if (!sel) {
        return;
      }
      const focus = selectionToBlock(blockElement, sel);
      if (!focus) {
        return;
      }
      return selectNextBlock(focus);
    },
    ArrowUp: () => {
      reset();
      const sel = getSelectionBySide(blockElement, false);
      if (!sel) {
        return;
      }
      const focus = selectionToBlock(blockElement, sel);
      if (!focus) {
        return;
      }
      return selectPrevBlock(focus);
    },
    'Shift-ArrowDown': () => {
      if (!anchorSel) {
        anchorSel = getSelectionBySide(blockElement, true);
      }

      if (!anchorSel) {
        return null;
      }

      const anchorBlock = selectionToBlock(blockElement, anchorSel);
      if (!anchorBlock) {
        return null;
      }

      focusBlock = getNextBlock(focusBlock ?? anchorBlock);

      if (!focusBlock) {
        return;
      }

      selectBetween(anchorBlock, focusBlock, true);

      return true;
    },
    'Shift-ArrowUp': () => {
      if (!anchorSel) {
        anchorSel = getSelectionBySide(blockElement, false);
      }

      if (!anchorSel) {
        return null;
      }

      const anchorBlock = selectionToBlock(blockElement, anchorSel);
      if (!anchorBlock) {
        return null;
      }

      focusBlock = getPrevBlock(focusBlock ?? anchorBlock);

      if (!focusBlock) {
        return;
      }

      selectBetween(anchorBlock, focusBlock, false);

      return true;
    },
  });
};
