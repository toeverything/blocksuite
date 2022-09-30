import type { Quill, RangeStatic } from 'quill';
import type { BaseBlockModel, Store } from '@blocksuite/store';
import {
  BlockHost,
  handleBlockEndEnter,
  handleBlockSplit,
  handleIndent,
  handleKeyDown,
  handleKeyUp,
  handleSoftEnter,
  handleUnindent,
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
) => boolean;

const PREVENT_DEFAULT = false;
const ALLOW_DEFAULT = true;

function isAtBlockEnd(quill: Quill) {
  return quill.getLength() - 1 === quill.getSelection(true)?.index;
}

export const createKeyboardBindings = (
  store: Store,
  model: BaseBlockModel,
  selectionManager: BlockHost['selection']
) => {
  function undo() {
    store.undo();
    return PREVENT_DEFAULT;
  }

  function redo() {
    store.redo();
    return PREVENT_DEFAULT;
  }

  function hardEnter(this: KeyboardEventThis) {
    const isEnd = isAtBlockEnd(this.quill);
    if (isEnd) {
      handleBlockEndEnter(store, model);
    } else {
      const index = this.quill.getSelection()?.index || 0;
      handleBlockSplit(store, model, index);
    }

    return PREVENT_DEFAULT;
  }

  function softEnter(this: KeyboardEventThis) {
    const index = this.quill.getSelection()?.index || 0;
    handleSoftEnter(store, model, index);
    this.quill.setSelection(index + 1, 0);

    return PREVENT_DEFAULT;
  }

  function indent(this: KeyboardEventThis) {
    handleIndent(store, model);
    return PREVENT_DEFAULT;
  }

  function unindent(this: KeyboardEventThis) {
    handleUnindent(store, model);
    return PREVENT_DEFAULT;
  }

  function keyUp(this: KeyboardEventThis, range: IQuillRange) {
    if (range.index >= 0) {
      return handleKeyUp(model, selectionManager, this.quill.root);
    }
    return ALLOW_DEFAULT;
  }

  function keyDown(this: KeyboardEventThis, range: IQuillRange) {
    if (range.index >= 0) {
      return handleKeyDown(model, selectionManager, this.quill.root);
    }
    return ALLOW_DEFAULT;
  }

  function keyLeft(this: KeyboardEventThis, range: IQuillRange) {
    if (range.index === 0) {
      selectionManager.activePreviousBlock(model.id, 'end');
      return PREVENT_DEFAULT;
    }
    return ALLOW_DEFAULT;
  }

  function keyRight(this: KeyboardEventThis, range: IQuillRange) {
    const textLength = this.quill.getText().length;
    if (range.index + range.length + 1 === textLength) {
      selectionManager.activeNextBlock(model.id, 'start');
      return PREVENT_DEFAULT;
    }
    return ALLOW_DEFAULT;
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
    backspace: {
      key: 'backspace',
      handler() {
        return ALLOW_DEFAULT;
      },
    },
    up: {
      key: 'up',
      shiftKey: false,
      handler: keyUp,
    },
    down: {
      key: 'down',
      shiftKey: false,
      handler: keyDown,
    },
    left: {
      key: 'left',
      shiftKey: false,
      handler: keyLeft,
    },
    right: {
      key: 'right',
      shiftKey: false,
      handler: keyRight,
    },
  };

  return keyboardBindings;
};
