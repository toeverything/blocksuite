import type { UIEventHandler } from '@blocksuite/block-std';
import type { BaseSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import { assertExists } from '@blocksuite/store';

import type { DocPageBlockComponent } from '../../page-block/doc/doc-page-block.js';
import { autoScroll } from '../../page-block/text-selection/utils.js';
import type { PageBlockComponent } from '../../page-block/types.js';
import type { NoteBlockComponent } from '../note-block.js';
import {
  horizontalGetNextCaret,
  horizontalMoveCursorToNextText,
} from './utils.js';

export class TextNavigation {
  private _anchorRange: Range | null = null;
  private _focusRange: Range | null = null;

  private get _pageBlock() {
    const page = this.host.closest<PageBlockComponent>(
      'affine-doc-page,affine-edgeless-page'
    );
    assertExists(page);
    return page;
  }

  private get _rangeManager() {
    const { rangeManager } = this._pageBlock;
    assertExists(rangeManager);

    return rangeManager;
  }

  private get _selection() {
    return this.host.root.selectionManager;
  }

  private get _viewportElement() {
    if (this._pageBlock.tagName === 'AFFINE-DOC-PAGE') {
      return (this._pageBlock as DocPageBlockComponent).viewportElement;
    }
    return null;
  }

  private get _currentSelection() {
    return this._selection.value;
  }

  private _setSelections = (selection: BaseSelection[]) => {
    const otherSelections = this._currentSelection.filter(
      sel => !sel.is('text') && !sel.is('block')
    );

    this._selection.set([...otherSelections, ...selection]);
  };

  constructor(public host: NoteBlockComponent) {}

  Escape: UIEventHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    const blocks = this._rangeManager.findBlockElementsByRange(range);

    const manager = this.host.root.selectionManager;

    const blockSelections = blocks.map(block => {
      return manager.getInstance('block', {
        path: block.path,
      });
    });

    this._setSelections(blockSelections);
  };

  ArrowUp: UIEventHandler = ctx => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = Array.from(range.getClientRects()).at(0);
    if (!rect) {
      return;
    }
    const result = horizontalMoveCursorToNextText(
      {
        x: rect.left,
        y: rect.top,
      },
      this.host,
      true
    );
    const nextRect = result?.caret.node.parentElement?.getBoundingClientRect();
    if (nextRect) {
      ctx.get('keyboardState').raw.preventDefault();
      if (this._viewportElement) {
        autoScroll(this._viewportElement, nextRect.top, 200);
      }
    }
    return;
  };

  ArrowDown: UIEventHandler = ctx => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = Array.from(range.getClientRects()).at(-1);
    if (!rect) {
      return;
    }
    const result = horizontalMoveCursorToNextText(
      {
        x: rect.right,
        y: rect.top,
      },
      this.host
    );
    const nextRect = result?.caret.node.parentElement?.getBoundingClientRect();
    if (nextRect) {
      ctx.get('keyboardState').raw.preventDefault();
      if (this._viewportElement) {
        autoScroll(this._viewportElement, nextRect.bottom, 200);
      }
    }
    return;
  };

  ArrowRight: UIEventHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = Array.from(range.getClientRects()).at(-1);
    if (!rect) {
      return;
    }
    const caret = horizontalGetNextCaret(
      {
        x: rect.right,
        y: rect.top,
      },
      this.host,
      false
    );
    if (!caret) return;
    const { node } = caret;
    const blockElement = node.parentElement?.closest(
      '[data-block-id]'
    ) as BlockElement;
    if (!blockElement) return;

    this._setSelections([
      this._selection.getInstance('text', {
        from: {
          index: 0,
          length: 0,
          path: blockElement.path,
        },
        to: null,
      }),
    ]);
  };

  ArrowLeft: UIEventHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = Array.from(range.getClientRects()).at(0);
    if (!rect) {
      return;
    }
    const caret = horizontalGetNextCaret(
      {
        x: rect.right,
        y: rect.top,
      },
      this.host,
      true
    );
    if (!caret) return;
    const { node } = caret;
    const blockElement = node.parentElement?.closest(
      '[data-block-id]'
    ) as BlockElement;
    if (!blockElement) return;

    this._setSelections([
      this._selection.getInstance('text', {
        from: {
          index: blockElement.model.text?.length ?? 0,
          length: 0,
          path: blockElement.path,
        },
        to: null,
      }),
    ]);
  };

  ShiftArrowUp: UIEventHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!this._anchorRange) {
      this._anchorRange = range.cloneRange();
    }
    const rect = Array.from((this._focusRange ?? range).getClientRects()).at(0);
    if (!rect) {
      return;
    }
    const caret = horizontalGetNextCaret(
      {
        x: rect.left,
        y: rect.top,
      },
      this.host,
      true
    );
    if (!caret) {
      return;
    }
    const _range = document.createRange();
    _range.setStart(caret.node, caret.offset);
    this._rangeManager.renderRange(_range, this._anchorRange);
    this._focusRange = _range.cloneRange();

    if (this._viewportElement) {
      autoScroll(
        this._viewportElement,
        this._rangeManager.value.getBoundingClientRect().top
      );
    }

    return true;
  };

  ShiftArrowDown: UIEventHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!this._anchorRange) {
      this._anchorRange = range.cloneRange();
    }
    const rect = Array.from((this._focusRange ?? range).getClientRects()).at(
      -1
    );
    if (!rect) {
      return;
    }
    const caret = horizontalGetNextCaret(
      {
        x: rect.right,
        y: rect.top,
      },
      this.host,
      false
    );
    if (!caret) {
      return;
    }
    const _range = document.createRange();
    _range.setStart(caret.node, caret.offset);
    this._rangeManager.renderRange(_range, this._anchorRange);
    this._focusRange = _range.cloneRange();

    if (this._viewportElement) {
      autoScroll(
        this._viewportElement,
        this._rangeManager.value.getBoundingClientRect().bottom
      );
    }

    return true;
  };

  keyDown: UIEventHandler = () => {
    this._anchorRange = null;
    this._focusRange = null;
  };
}
