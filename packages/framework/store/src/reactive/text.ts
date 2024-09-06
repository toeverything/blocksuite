import type { BaseTextAttributes, DeltaInsert } from '@blocksuite/inline';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { type Signal, signal } from '@preact/signals-core';
import * as Y from 'yjs';

export interface OptionalAttributes {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: Record<string, any>;
}
export type DeltaOperation = {
  insert?: string;
  delete?: number;
  retain?: number;
} & OptionalAttributes;

export type OnTextChange = (data: Y.Text) => void;

export class Text {
  private _deltas$: Signal<DeltaOperation[]>;

  private _length$: Signal<number>;

  private _onChange?: OnTextChange;

  private readonly _yText: Y.Text;

  get deltas$() {
    return this._deltas$;
  }

  get length() {
    return this._length$.value;
  }

  get yText() {
    return this._yText;
  }

  constructor(
    input?: Y.Text | string | DeltaInsert[],
    onChange?: OnTextChange
  ) {
    this._onChange = onChange;
    let length = 0;
    if (typeof input === 'string') {
      const text = input.replaceAll('\r\n', '\n');
      length = text.length;
      this._yText = new Y.Text(text);
    } else if (input instanceof Y.Text) {
      this._yText = input;
      length = input.length;
    } else if (input instanceof Array) {
      for (const delta of input) {
        if (delta.insert) {
          delta.insert = delta.insert.replaceAll('\r\n', '\n');
          length += delta.insert.length;
        }
      }
      const yText = new Y.Text();
      yText.applyDelta(input);
      this._yText = yText;
    } else {
      this._yText = new Y.Text();
    }

    this._length$ = signal(length);
    this._deltas$ = signal([]);
    this._yText.observe(() => {
      this._length$.value = this._yText.length;
      this._deltas$.value = this._yText.toDelta();
      this._onChange?.(this._yText);
    });
  }

  /**
   * @deprecated
   * This method will lose the change observer unless you pass the onChange callback.
   */
  static fromDelta(delta: DeltaOperation[], onChange?: OnTextChange) {
    const result = new Y.Text();
    result.applyDelta(delta);
    return new Text(result, onChange);
  }

  private _transact(callback: () => void) {
    const doc = this._yText.doc;
    if (!doc) {
      throw new BlockSuiteError(
        ErrorCode.ReactiveProxyError,
        'Failed to transact text! yText is not attached to a doc'
      );
    }
    doc.transact(() => {
      callback();
    }, doc.clientID);
  }

  applyDelta(delta: DeltaOperation[]) {
    this._transact(() => {
      this._yText?.applyDelta(delta);
    });
  }

  bind(onChange?: OnTextChange) {
    this._onChange = onChange;
  }

  clear() {
    if (!this._yText.length) {
      return;
    }
    this._transact(() => {
      this._yText.delete(0, this._yText.length);
    });
  }

  clone() {
    return new Text(this._yText.clone(), this._onChange);
  }

  delete(index: number, length: number) {
    if (length === 0) {
      return;
    }
    if (index < 0 || length < 0 || index + length > this._yText.length) {
      throw new BlockSuiteError(
        ErrorCode.ReactiveProxyError,
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
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format(index: number, length: number, format: any) {
    if (length === 0) {
      return;
    }
    if (index < 0 || length < 0 || index + length > this._yText.length) {
      throw new BlockSuiteError(
        ErrorCode.ReactiveProxyError,
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
    });
  }

  insert(content: string, index: number, attributes?: Record<string, unknown>) {
    if (!content.length) {
      return;
    }
    if (index < 0 || index > this._yText.length) {
      throw new BlockSuiteError(
        ErrorCode.ReactiveProxyError,
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
    });
  }

  join(other: Text) {
    if (!other || !other.toDelta().length) {
      return;
    }
    this._transact(() => {
      const yOther = other._yText;
      const delta: DeltaOperation[] = yOther.toDelta();
      delta.unshift({ retain: this._yText.length });
      this._yText.applyDelta(delta);
    });
  }

  replace(
    index: number,
    length: number,
    content: string,
    attributes?: BaseTextAttributes
  ) {
    if (index < 0 || length < 0 || index + length > this._yText.length) {
      throw new BlockSuiteError(
        ErrorCode.ReactiveProxyError,
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
    });
  }

  sliceToDelta(begin: number, end?: number): DeltaOperation[] {
    const result: DeltaOperation[] = [];
    if (end && begin >= end) {
      return result;
    }

    if (begin === 0 && end === 0) {
      return [];
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
      throw new BlockSuiteError(
        ErrorCode.ReactiveProxyError,
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
      throw new BlockSuiteError(
        ErrorCode.ReactiveProxyError,
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
        throw new BlockSuiteError(
          ErrorCode.ReactiveProxyError,
          'This text cannot be split because it contains non-string insert.'
        );
      }
    }

    this.delete(index, this.length - index);
    const rightYText = new Y.Text();
    rightYText.applyDelta(rightDeltas);
    const rightText = new Text(rightYText, this._onChange);

    return rightText;
  }

  toDelta(): DeltaOperation[] {
    return this._yText?.toDelta() || [];
  }

  toString() {
    return this._yText?.toString() || '';
  }
}
