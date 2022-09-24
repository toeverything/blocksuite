import type { Quill, RangeStatic } from 'quill';
import type { BaseBlockModel, Store } from '@building-blocks/store';
import {
  handleBlockEndEnter,
  handleIndent,
  handleUnindent,
} from '@building-blocks/shared';

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

export const createKeyboardBindings = (store: Store, model: BaseBlockModel) => {
  const clientID = store.doc.clientID;

  function undo() {
    store.undo();
  }

  function redo() {
    store.redo();
  }

  function hardEnter(this: KeyboardEventThis) {
    const isAtBlockEnd =
      this.quill.getLength() - 1 === this.quill.getSelection()?.index;
    if (isAtBlockEnd) {
      handleBlockEndEnter(store, model);
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
  };

  return keyboardBindings;
};
