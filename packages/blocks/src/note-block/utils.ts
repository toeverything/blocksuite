import type { BlockSelection } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { almostEqual } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { deserializeXYWH } from '@blocksuite/phasor';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import { EDGELESS_BLOCK_CHILD_PADDING } from '../__internal__/consts.js';
import { EdgelessPageBlockComponent } from '../page-block/edgeless/edgeless-page-block.js';
import {
  autoScroll,
  caretFromPoint,
} from '../page-block/text-selection/utils.js';
import { getClosestPageBlockComponent } from '../page-block/utils/query.js';
import type { NoteBlockComponent } from './note-block.js';

const getSelection = (blockComponent: BlockElement) =>
  blockComponent.root.selectionManager;

const getView = (blockComponent: BlockElement) => blockComponent.root.viewStore;

export const pathToBlock = (blockElement: BlockElement, path: string[]) =>
  getView(blockElement).viewFromPath('block', path);

export const ensureBlockInContainer = (
  blockElement: BlockElement,
  containerElement: BlockElement
) =>
  containerElement.contains(blockElement) && blockElement !== containerElement;

export function getNextSibling(
  blockElement: BlockElement,
  filter?: (block: BlockElement) => boolean
) {
  const view = getView(blockElement);
  const nextView = view.findNext(blockElement.path, node => {
    if (node.type !== 'block' || node.view.contains(blockElement)) {
      return;
    }
    if (filter && !filter(node.view as BlockElement)) {
      return;
    }
    return true;
  });
  if (!nextView) return null;
  return view.viewFromPath('block', nextView.path);
}

export function getPrevSibling(
  blockElement: BlockElement,
  filter?: (block: BlockElement) => boolean
) {
  const view = getView(blockElement);
  const nextView = view.findPrev(blockElement.path, node => {
    if (node.type !== 'block') {
      return;
    }
    if (filter && !filter(node.view as BlockElement)) {
      return;
    }
    return true;
  });
  if (!nextView) return null;
  return view.viewFromPath('block', nextView.path);
}

function getLastGrandChild(blockElement: BlockElement) {
  const view = getView(blockElement);
  let output = blockElement;
  view.walkThrough((node, _index, parent) => {
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
}

export function setBlockSelection(blockElement: BlockElement) {
  const selection = getSelection(blockElement);
  const path = blockElement.path;
  selection.update(selList => {
    return selList
      .filter(sel => !sel.is('text') && !sel.is('block'))
      .concat(selection.getInstance('block', { path }));
  });
}

export function setTextSelectionBySide(
  blockElement: BlockElement,
  tail: boolean
) {
  const selection = getSelection(blockElement);
  const path = blockElement.path;

  selection.setGroup('note', [
    selection.getInstance('text', {
      from: {
        path,
        index: tail ? blockElement.model.text?.length ?? 0 : 0,
        length: 0,
      },
      to: null,
    }),
  ]);
}

export function getBlockSelectionBySide(
  blockElement: BlockElement,
  tail: boolean
) {
  const selection = getSelection(blockElement);
  const selections = selection.value.filter(sel => sel.is('block'));
  const sel = selections.at(tail ? -1 : 0) as BlockSelection | undefined;
  return sel ?? null;
}

export function getTextSelection(blockElement: BlockElement) {
  const selection = getSelection(blockElement);
  return selection.find('text');
}

function getAnchorBlockSelection(blockElement: BlockElement) {
  const selection = getSelection(blockElement);
  const selections = selection.value.filter(
    sel => sel.is('text') || sel.is('block')
  );
  const sel = selections.find(sel =>
    PathFinder.equals(sel.path, blockElement.path)
  );
  if (!sel) return null;

  return sel;
}

export function getNextBlock(
  blockElement: BlockElement,
  filter?: (block: BlockElement) => boolean
) {
  const focus = getAnchorBlockSelection(blockElement);
  if (!focus) return null;

  const view = getView(blockElement);
  const focusBlock = view.viewFromPath('block', focus.path);
  if (!focusBlock) return null;

  let next: BlockElement | null = null;
  if (focusBlock.childBlockElements[0]) {
    next = focusBlock.childBlockElements[0];
  }

  if (!next) {
    next = getNextSibling(focusBlock, filter);
  }

  if (next && !next.contains(focusBlock)) {
    return next;
  }

  return null;
}

export function getPrevBlock(
  blockElement: BlockElement,
  filter?: (block: BlockElement) => boolean
) {
  const focus = getAnchorBlockSelection(blockElement);
  if (!focus) return null;

  const view = getView(blockElement);
  const focusBlock = view.viewFromPath('block', focus.path);
  if (!focusBlock) return null;

  let prev: BlockElement | null = getPrevSibling(focusBlock, filter);

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
}

export function selectBetween(
  anchorBlock: BlockElement,
  focusBlock: BlockElement,
  tail: boolean
) {
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
}

export function getCurrentCaretPos(tail: boolean) {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();

  return tail ? rects[rects.length - 1] : rects[0];
}

export function horizontalGetNextCaret(
  point: { x: number; y: number },
  block: BlockElement,
  forward = false,
  span = 5
) {
  const selection = document.getSelection();
  if (!selection) {
    return;
  }
  const current = getCurrentCaretPos(!forward);
  if (!current) return;
  const rect = block.getBoundingClientRect();
  let _point = {
    x: Math.max(point.x, rect.left, current.x),
    y: forward ? Math.min(point.y, current.y) : Math.max(point.y, current.y),
  };
  let move = caretFromPoint(_point.x, _point.y);
  const anchor = caretFromPoint(_point.x, _point.y);
  const needContinue = () => {
    if (!move) {
      return false;
    }
    if (!anchor) {
      return false;
    }
    if (!block.contains(move.node)) {
      return false;
    }
    if (current && Math.abs(current.y - _point.y) < span) {
      return true;
    }
    if (move.node.nodeType === Node.TEXT_NODE) {
      return false;
    }
    return true;
  };
  while (needContinue()) {
    _point = {
      x: _point.x,
      y: _point.y + (forward ? -1 * span : span),
    };
    move = caretFromPoint(_point.x, _point.y);
  }
  if (!move || !move.node.parentElement?.closest('[data-virgo-root]')) {
    const texts = getTextNodesFromElement(block);
    const text = forward ? texts[texts.length - 1] : texts[0];
    return {
      node: text,
      offset: forward ? text.textContent?.length ?? 0 : 0,
    };
  }

  return move;
}

export function horizontalMoveCursorToNextText(
  point: { x: number; y: number },
  block: BlockElement,
  forward = false
) {
  const selection = document.getSelection();
  if (!selection) {
    return;
  }
  const caret = horizontalGetNextCaret(point, block, forward);
  if (!caret) {
    return;
  }
  const { node, offset } = caret;

  const nextRange = document.createRange();
  nextRange.setStart(node, offset);
  selection.removeAllRanges();
  selection.addRange(nextRange);

  const element = node.parentElement;
  element?.scrollIntoView({ block: 'nearest' });

  return {
    caret,
    range: nextRange,
  };
}

export function moveCursorToNextBlockElement(nextBlock: BlockElement) {
  const pos = getCurrentCaretPos(true);
  if (!pos || !nextBlock) {
    return;
  }
  const nextRect = horizontalMoveCursorToNextText(
    {
      x: pos.right,
      y: nextBlock.getBoundingClientRect().top ?? 0,
    },
    nextBlock
  );
  if (nextRect) {
    const viewport = nextBlock.closest('affine-doc-page')?.viewportElement;
    if (viewport) {
      autoScroll(viewport, nextRect.range.getBoundingClientRect().bottom);
    }
  }
}

export function moveCursorToPrevBlockElement(prevBlock: BlockElement) {
  const pos = getCurrentCaretPos(false);
  if (!pos || !prevBlock) {
    return;
  }
  const nextRect = horizontalMoveCursorToNextText(
    {
      x: pos.left,
      y: prevBlock.getBoundingClientRect().bottom - 2 ?? 0,
    },
    prevBlock,
    true
  );
  if (nextRect) {
    const viewport = prevBlock.closest('affine-doc-page')?.viewportElement;
    if (viewport) {
      autoScroll(viewport, nextRect.range.getBoundingClientRect().top);
    }
  }
}

export function tryUpdateNoteSize(noteElement: NoteBlockComponent) {
  requestAnimationFrame(() => {
    const page = noteElement.page;
    if (!page.root) return;

    let zoom = 1;
    const pageElement = getClosestPageBlockComponent(noteElement);
    if (pageElement instanceof EdgelessPageBlockComponent) {
      zoom = pageElement.surface.viewport.zoom;
    }

    const bound = noteElement.getBoundingClientRect();
    const [x, y, w, h] = deserializeXYWH(noteElement.model.xywh);
    const newModelHeight =
      bound.height / zoom + EDGELESS_BLOCK_CHILD_PADDING * 2;
    if (!almostEqual(newModelHeight, h)) {
      page.updateBlock(noteElement.model, {
        xywh: JSON.stringify([x, y, w, Math.round(newModelHeight)]),
      });
    }
  });
}
