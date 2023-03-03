/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BaseTextAttributes, DeltaInsert } from '@blocksuite/virgo';
import type { DeltaOperation, Quill } from 'quill';
import * as Y from 'yjs';

import type { Space } from './space.js';

// Removes the pending '\n's if it has no attributes
export function normQuillDelta(delta: DeltaOperation[]): DeltaOperation[] {
  if (delta.length > 0) {
    const d = delta[delta.length - 1];
    const insert: string = d.insert;
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
  private _yText: Y.Text;

  // TODO toggle transact by options
  private _shouldTransact = true;

  constructor(input?: Y.Text | string) {
    if (typeof input === 'string') {
      this._yText = new Y.Text(input);
    } else if (input instanceof Y.Text) {
      this._yText = input;
    } else {
      this._yText = new Y.Text();
    }
  }

  static fromDelta(delta: DeltaOperation[]) {
    const result = new Y.Text();
    result.applyDelta(delta);
    return new Text(result);
  }

  get length() {
    return this._yText.length;
  }

  get yText() {
    return this._yText;
  }

  private _transact(callback: () => void) {
    if (this._shouldTransact) {
      const doc = this._yText.doc;
      if (!doc) {
        throw new Error(
          'Failed to transact text! yText is not attached to a doc'
        );
      }
      doc.transact(() => {
        callback();
      }, doc.clientID);
    } else {
      callback();
    }
  }

  clone() {
    return new Text(this._yText.clone());
  }

  /**
   * NOTE: The string included in [index, index + length) will be deleted.
   *
   * Here are three cases for point position(index + length):
   * [{insert: 'abc', ...}, {insert: 'def', ...}, {insert: 'ghi', ...}]
   * 1. abc|de|fghi
   *    left: [{insert: 'abc', ...}]
   *    right: [{insert: 'f', ...}, {insert: 'ghi', ...}]
   * 2. abc|def|ghi
   *    left: [{insert: 'abc', ...}]
   *    right: [{insert: 'ghi', ...}]
   * 3. abc|defg|hi
   *    left: [{insert: 'abc', ...}]
   *    right: [{insert: 'hi', ...}]
   */
  split(index: number, length = 0): Text {
    if (index < 0 || length < 0 || index + length > this._yText.length) {
      throw new Error(
        'Failed to split text! Index or length out of range, index: ' +
          index +
          ', length: ' +
          length +
          ', text length: ' +
          this._yText.length
      );
    }
    const deltas = this._yText.toDelta();
    if (!(deltas instanceof Array)) {
      throw new Error(
        'This text cannot be split because we failed to get the deltas of it.'
      );
    }
    let tmpIndex = 0;
    const rightDeltas: DeltaInsert[] = [];
    for (let i = 0; i < deltas.length; i++) {
      const insert = deltas[i].insert;
      if (typeof insert === 'string') {
        if (tmpIndex + insert.length >= index + length) {
          const insertRight = insert.slice(index + length - tmpIndex);
          rightDeltas.push({
            insert: insertRight,
            attributes: deltas[i].attributes,
          });
          rightDeltas.push(...deltas.slice(i + 1));
          break;
        }
        tmpIndex += insert.length;
      } else {
        throw new Error(
          'This text cannot be split because it contains non-string insert.'
        );
      }
    }

    this.delete(index, this.length - index);
    const rightYText = new Y.Text();
    rightYText.applyDelta(rightDeltas);
    const rightText = new Text(rightYText);

    return rightText;
  }

  insert(content: string, index: number, attributes?: Record<string, unknown>) {
    if (!content.length) {
      return;
    }
    if (index < 0 || index > this._yText.length) {
      throw new Error(
        'Failed to insert text! Index or length out of range, index: ' +
          index +
          ', length: ' +
          length +
          ', text length: ' +
          this._yText.length
      );
    }
    this._transact(() => {
      this._yText.insert(index, content, attributes);
      this._yText.meta = { split: true };
    });
  }

  /**
   * @deprecated Use {@link insert} or {@link applyDelta} instead.
   */
  insertList(insertTexts: DeltaOperation[], index: number) {
    if (!insertTexts.length) {
      return;
    }
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
    if (!other.toDelta().length) {
      return;
    }
    this._transact(() => {
      const yOther = other._yText;
      const delta: DeltaOperation[] = yOther.toDelta();
      delta.unshift({ retain: this._yText.length });
      this._yText.applyDelta(delta);
      this._yText.meta = { join: true };
    });
  }

  format(index: number, length: number, format: any) {
    if (length === 0) {
      return;
    }
    if (index < 0 || length < 0 || index + length > this._yText.length) {
      throw new Error(
        'Failed to format text! Index or length out of range, index: ' +
          index +
          ', length: ' +
          length +
          ', text length: ' +
          this._yText.length
      );
    }
    this._transact(() => {
      this._yText.format(index, length, format);
      this._yText.meta = { format: true };
    });
  }

  delete(index: number, length: number) {
    if (length === 0) {
      return;
    }
    if (index < 0 || length < 0 || index + length > this._yText.length) {
      throw new Error(
        'Failed to delete text! Index or length out of range, index: ' +
          index +
          ', length: ' +
          length +
          ', text length: ' +
          this._yText.length
      );
    }
    this._transact(() => {
      this._yText.delete(index, length);
      this._yText.meta = { delete: true };
    });
  }

  replace(
    index: number,
    length: number,
    content: string,
    attributes?: BaseTextAttributes
  ) {
    if (index < 0 || length < 0 || index + length > this._yText.length) {
      throw new Error(
        'Failed to replace text! The length of the text is' +
          this._yText.length +
          ', but you are trying to replace from' +
          index +
          'to' +
          index +
          length
      );
    }
    this._transact(() => {
      this._yText.delete(index, length);
      this._yText.insert(index, content, attributes);
      this._yText.meta = { replace: true };
    });
  }

  clear() {
    if (!this._yText.length) {
      return;
    }
    this._transact(() => {
      this._yText.delete(0, this._yText.length);
      this._yText.meta = { clear: true };
    });
  }

  applyDelta(delta: DeltaOperation[]) {
    this._transact(() => {
      this._yText?.applyDelta(delta);
    });
  }

  toDelta(): DeltaOperation[] {
    return this._yText?.toDelta() || [];
  }

  sliceToDelta(begin: number, end?: number): DeltaOperation[] {
    const result: DeltaOperation[] = [];
    if (end && begin >= end) {
      return result;
    }

    const delta = this.toDelta();
    if (begin < 1 && !end) {
      return delta;
    }

    if (delta && delta instanceof Array) {
      let charNum = 0;
      for (let i = 0; i < delta.length; i++) {
        const content = delta[i];
        let contentText: string = content.insert || '';
        const contentLen = contentText.length;

        const isLastOp = end && charNum + contentLen > end;
        const isFirstOp = charNum + contentLen > begin && result.length === 0;
        if (isFirstOp && isLastOp) {
          contentText = contentText.slice(begin - charNum, end - charNum);
          result.push({
            ...content,
            insert: contentText,
          });
          break;
        } else if (isFirstOp || isLastOp) {
          contentText = isLastOp
            ? contentText.slice(0, end - charNum)
            : contentText.slice(begin - charNum);

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
  private _negatedUsedFormats: Record<string, any>;

  constructor(space: Space, yText: Y.Text, quill: Quill) {
    this.space = space;
    this.yText = yText;
    this.doc = space.doc;
    this.quill = quill;
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
    // eventType === 'text-change' &&
    //   console.trace('quill event', eventType, delta, state, origin);
    const { yText } = this;

    if (delta && delta.ops) {
      // update content
      const ops = transformDelta(delta, yText).ops;
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

function transformDelta(delta: any, yText: Y.Text) {
  // delta.ops.forEach((op: any) => (op.attributes = undefined));
  return delta;
}
