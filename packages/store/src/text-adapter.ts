/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BaseTextAttributes, DeltaInsert } from '@blocksuite/virgo';
import * as Y from 'yjs';

export interface OptionalAttributes {
  attributes?: {
    [key: string]: any;
  };
}
export type DeltaOperation = {
  insert?: string;
  delete?: number;
  retain?: number;
} & OptionalAttributes;

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
    });
  }

  clear() {
    if (!this._yText.length) {
      return;
    }
    this._transact(() => {
      this._yText.delete(0, this._yText.length);
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
