import type { Quill, RangeStatic } from 'quill';
import type { BaseBlockModel, Store } from '@blocksuite/store';
import {
  BlockHost,
  handleBlockEndEnter,
  handleIndent,
  handleUnindent,
  Point,
} from '@blocksuite/shared';
import IQuillRange from 'quill-cursors/dist/quill-cursors/i-range';

interface BindingContext {
  collapsed: boolean;
  empty: boolean;
  offset: number;
  prefix: string;
  suffix: string;
  format: Record<string, unknown>;
}

type KeyboardBindings = Record<
  string,
  {
    key: string | number;
    handler: KeyboardBindingHandler;
    prefix?: RegExp;
    suffix?: RegExp;
    shortKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    ctrlKey?: boolean;
  }
>;

interface KeyboardEventThis {
  quill: Quill;
  options: {
    bindings: KeyboardBindings;
  };
}

type KeyboardBindingHandler = (
  this: KeyboardEventThis,
  range: RangeStatic,
  context: BindingContext
) => void;

function isAtBlockEnd(quill: Quill) {
  return quill.getLength() - 1 === quill.getSelection(true)?.index;
}

export const createKeyboardBindings = (
  store: Store,
  model: BaseBlockModel,
  selectionManager: BlockHost['selection']
) => {
  const clientID = store.doc.clientID;

  function undo() {
    store.undo();
  }

  function redo() {
    store.redo();
  }

  function hardEnter(this: KeyboardEventThis) {
    const isEnd = isAtBlockEnd(this.quill);
    if (isEnd) {
      handleBlockEndEnter(store, model);
    } else {
      // TODO split text
    }
  }

  function softEnter(this: KeyboardEventThis) {
    const index = this.quill.getSelection()?.index || 0;
    // @ts-ignore
    this.quill.insertText(index, '\n', clientID);
  }

  function indent(this: KeyboardEventThis) {
    handleIndent(store, model);
  }

  function unindent(this: KeyboardEventThis) {
    handleUnindent(store, model);
  }

  function keyup(this: KeyboardEventThis, range: IQuillRange) {
    if (range.index >= 0) {
      const selection = window.getSelection();
      if (selection) {
        const range = selection.getRangeAt(0);
        const { height, left, top } = range.getBoundingClientRect();
        // TODO resolve compatible problem
        const newRange = document.caretRangeFromPoint(left, top - height / 2);
        if (!newRange || !this.quill.root.contains(newRange.startContainer)) {
          selectionManager.activePreviousBlock(model.id, new Point(left, top));
          return false;
        }
      }
    }
    return true;
  }

  function keydown(this: KeyboardEventThis, range: IQuillRange) {
    if (range.index >= 0) {
      const selection = window.getSelection();
      if (selection) {
        const range = selection.getRangeAt(0);
        const { bottom, left, height } = range.getBoundingClientRect();
        // TODO resolve compatible problem
        const newRange = document.caretRangeFromPoint(
          left,
          bottom + height / 2
        );
        if (!newRange || !this.quill.root.contains(newRange.startContainer)) {
          selectionManager.activeNextBlock(model.id, new Point(left, bottom));
          return false;
        }
      }
    }
    return true;
  }

  const keyboardBindings: KeyboardBindings = {
    undo: {
      key: 'z',
      shortKey: true,
      handler: undo,
    },
    redo: {
      key: 'z',
      shiftKey: true,
      shortKey: true,
      handler: redo,
    },
    hardEnter: {
      key: 'enter',
      handler: hardEnter,
    },
    softEnter: {
      key: 'enter',
      shiftKey: true,
      handler: softEnter,
    },
    tab: {
      key: 'tab',
      handler: indent,
    },
    shiftTab: {
      key: 'tab',
      shiftKey: true,
      handler: unindent,
    },
    up: {
      key: 'up',
      shiftKey: false,
      handler: keyup,
    },
    down: {
      key: 'down',
      shiftKey: false,
      handler: keydown,
    },
  };

  return keyboardBindings;
};
