/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Y from 'yjs';
import type { AwarenessAdapter } from './awareness';
import type { DeltaOperation, Quill } from 'quill';
import type { Space } from './space';

type PrelimTextType = 'splitLeft' | 'splitRight';

export type TextType = PrelimText | Text;

// Removes the pending '\n's if it has no attributes
export function normQuillDelta(delta: any) {
  if (delta.length > 0) {
    const d = delta[delta.length - 1];
    const insert = d.insert;
    if (
      d.attributes === undefined &&
      insert !== undefined &&
      insert.slice(-1) === '\n'
    ) {
      delta = delta.slice();
      let ins = insert.slice(0, -1);
      while (ins.slice(-1) === '\n') {
        ins = ins.slice(0, -1);
      }
      delta[delta.length - 1] = { insert: ins };
      if (ins.length === 0) {
        delta.pop();
      }
      return delta;
    }
  }
  return delta;
}

const UNSUPPORTED_MSG = 'PrelimText does not support ';

export class PrelimText {
  ready = false;
  type: PrelimTextType;
  index: number;
  constructor(type: PrelimTextType, index: number) {
    this.type = type;
    this.index = index;
  }

  get length() {
    return 0;
  }

  clone() {
    throw new Error(UNSUPPORTED_MSG + 'clone');
  }

  insert() {
    throw new Error(UNSUPPORTED_MSG + 'insert');
  }

  insertList() {
    throw new Error(UNSUPPORTED_MSG + 'insertList');
  }

  split() {
    throw new Error(UNSUPPORTED_MSG + 'split');
  }

  join() {
    throw new Error(UNSUPPORTED_MSG + 'join');
  }

  clear() {
    throw new Error(UNSUPPORTED_MSG + 'clear');
  }

  delete() {
    throw new Error(UNSUPPORTED_MSG + 'delete');
  }

  replace() {
    throw new Error(UNSUPPORTED_MSG + 'replace');
  }

  format() {
    throw new Error(UNSUPPORTED_MSG + 'format');
  }

  applyDelta() {
    throw new Error(UNSUPPORTED_MSG + 'applyDelta');
  }

  sliceToDelta() {
    throw new Error(UNSUPPORTED_MSG + 'sliceToDelta');
  }
}

declare module 'yjs' {
  interface Text {
    /**
     * Specific addition used by @blocksuite/store
     * When set, we know it hasn't been applied to quill.
     * When specified, we call this a "controlled operation".
     *
     * Consider renaming this to closer indicate this is simply a "controlled operation",
     * since we may not actually use this information.
     */
    meta?:
      | { split: true }
      | { join: true }
      | { format: true }
      | { delete: true }
      | { clear: true }
      | { replace: true };
  }
}

export class Text {
  private _space: Space;
  private _yText: Y.Text;

  // TODO toggle transact by options
  private _shouldTransact = true;

  constructor(space: Space, input: Y.Text | string) {
    this._space = space;
    if (typeof input === 'string') {
      this._yText = new Y.Text(input);
    } else {
      this._yText = input;
    }
  }

  static fromDelta(space: Space, delta: DeltaOperation[]) {
    const result = new Text(space, '');
    result.applyDelta(delta);
    return result;
  }

  get length() {
    return this._yText.length;
  }

  private _transact(callback: () => void) {
    const { _space, _shouldTransact } = this;
    _shouldTransact ? _space.transact(callback) : callback();
  }

  clone() {
    return new Text(this._space, this._yText.clone());
  }

  split(index: number): [PrelimText, PrelimText] {
    return [
      new PrelimText('splitLeft', index),
      new PrelimText('splitRight', index),
    ];
  }

  insert(content: string, index: number, attributes?: Record<string, unknown>) {
    this._transact(() => {
      this._yText.insert(index, content, attributes);
      this._yText.meta = { split: true };
    });
  }

  insertList(insertTexts: Record<string, unknown>[], index: number) {
    this._transact(() => {
      for (let i = insertTexts.length - 1; i >= 0; i--) {
        this._yText.insert(
          index,
          (insertTexts[i].insert as string) || '',
          // eslint-disable-next-line @typescript-eslint/ban-types
          insertTexts[i].attributes as Object | undefined
        );
      }
      this._yText.meta = { split: true };
    });
  }

  join(other: Text) {
    this._transact(() => {
      const yOther = other._yText;
      const delta = yOther.toDelta();
      delta.splice(0, 0, { retain: this._yText.length });
      this._yText.applyDelta(delta);
      this._yText.meta = { join: true };
    });
  }

  format(index: number, length: number, format: any) {
    this._transact(() => {
      this._yText.format(index, length, format);
      this._yText.meta = { format: true };
    });
  }

  delete(index: number, length: number) {
    this._transact(() => {
      this._yText.delete(index, length);
      this._yText.meta = { delete: true };
    });
  }

  replace(
    index: number,
    length: number,
    content: string,
    attributes?: Record<string, unknown>
  ) {
    this._transact(() => {
      this._yText.delete(index, length);
      this._yText.insert(index, content, attributes);
      this._yText.meta = { replace: true };
    });
  }

  clear() {
    this._transact(() => {
      this._yText.delete(0, this._yText.length);
      this._yText.meta = { clear: true };
    });
  }

  applyDelta(delta: any) {
    this._transact(() => {
      this._yText.applyDelta(delta);
    });
  }

  toDelta() {
    return this._yText?.toDelta() || [];
  }

  sliceToDelta(begin: number, end?: number) {
    if (end && begin >= end) {
      return [];
    }

    const delta = this.toDelta();
    if (begin < 1 && !end) {
      return delta;
    }
    const result = [];
    if (delta && delta instanceof Array) {
      let charNum = 0;
      for (let i = 0; i < delta.length; i++) {
        const content = delta[i];
        let contentText = content.insert || '';
        const contentLen = contentText.length;
        if (end && charNum + contentLen > end) {
          contentText = contentText.slice(0, end - charNum);
        }
        if (charNum + contentLen > begin && result.length === 0) {
          contentText = contentText.slice(begin - charNum);
        }
        if (charNum + contentLen > begin && result.length === 0) {
          result.push({
            ...content,
            insert: contentText,
          });
        } else {
          result.length > 0 && result.push(content);
        }
        if (end && charNum + contentLen > end) {
          break;
        }
        charNum = charNum + contentLen;
      }
    }
    return result;
  }

  toString() {
    return this._yText?.toString() || '';
  }
}

export class RichTextAdapter {
  readonly space: Space;
  readonly doc: Y.Doc;
  readonly yText: Y.Text;
  readonly quill: Quill;
  readonly quillCursors: any;
  readonly awareness: AwarenessAdapter;
  private _negatedUsedFormats: Record<string, any>;

  constructor(space: Space, yText: Y.Text, quill: Quill) {
    this.space = space;
    this.yText = yText;
    this.doc = space.doc;
    this.quill = quill;

    this.awareness = space.awareness;
    const quillCursors = quill.getModule('cursors') || null;
    this.quillCursors = quillCursors;
    // This object contains all attributes used in the quill instance
    this._negatedUsedFormats = {};

    this.yText.observe(this._yObserver);

    // This indirectly initializes _negatedUsedFormats.
    // Make sure this calls after the _quillObserver is set.
    quill.setContents(yText.toDelta(), this as any);
    quill.on('editor-change', this._quillObserver as any);
  }

  private _yObserver = (event: Y.YTextEvent) => {
    const isFromLocal = event.transaction.origin === this.doc.clientID;
    const isFromRemote = !isFromLocal;
    const isControlledOperation = !!event.target?.meta;

    // update quill if the change is from remote or using controlled operation
    const quillMustApplyUpdate = isFromRemote || isControlledOperation;

    if (quillMustApplyUpdate) {
      const eventDelta = event.delta;
      // We always explicitly set attributes, otherwise concurrent edits may
      // result in quill assuming that a text insertion shall inherit existing
      // attributes.
      const delta: any = [];
      for (let i = 0; i < eventDelta.length; i++) {
        const d = eventDelta[i];
        if (d.insert !== undefined) {
          delta.push(
            Object.assign({}, d, {
              attributes: Object.assign(
                {},
                this._negatedUsedFormats,
                d.attributes || {}
              ),
            })
          );
        } else {
          delta.push(d);
        }
      }
      // tell quill this is a remote update
      this.quill.updateContents(delta, this.doc.clientID as any);

      // @ts-ignore
      if (event.target?.meta) {
        // @ts-ignore
        delete event.target.meta;
      }
    }
  };

  private _quillObserver = (
    eventType: string,
    delta: any,
    state: any,
    origin: any
  ) => {
    const { yText } = this;

    if (delta && delta.ops) {
      // update content
      const ops = delta.ops;
      ops.forEach((op: any) => {
        if (op.attributes !== undefined) {
          for (const key in op.attributes) {
            if (this._negatedUsedFormats[key] === undefined) {
              this._negatedUsedFormats[key] = false;
            }
          }
        }
      });
      if (origin === 'user') {
        this.space.transact(() => {
          yText.applyDelta(ops);
        });
      }
    }
  };

  getCursor() {
    const selection = this.quill.getSelection();
    if (!selection) {
      return null;
    }
    const anchor = Y.createRelativePositionFromTypeIndex(
      this.yText,
      selection.index
    );
    const focus = Y.createRelativePositionFromTypeIndex(
      this.yText,
      selection.index + selection.length
    );
    return {
      anchor,
      focus,
    };
  }

  destroy() {
    this.yText.unobserve(this._yObserver);
    this.quill.off('editor-change', this._quillObserver as any);
  }
}
