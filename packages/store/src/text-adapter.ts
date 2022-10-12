/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Y from 'yjs';
import { AwarenessAdapter } from './awareness';
import type { Quill } from 'quill';
import type { Store } from './store';
<<<<<<< HEAD
=======

type PrelimTextEnityType = 'splitLeft' | 'splitRight';

export type TextType = PrelimTextEntity | TextEntity;

>>>>>>> origin
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

const UNSUPPORTED_MSG = 'PrelimTextEntity does not support ';

export class PrelimTextEntity {
  ready = false;
  type: PrelimTextEnityType;
  index: number;
  constructor(type: PrelimTextEnityType, index: number) {
    this.type = type;
    this.index = index;
  }

  clone() {
    throw new Error(UNSUPPORTED_MSG + 'clone');
  }

  insert() {
    throw new Error(UNSUPPORTED_MSG + 'insert');
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

  format() {
    throw new Error(UNSUPPORTED_MSG + 'format');
  }

<<<<<<< HEAD
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyDelta(_: any) {
=======
  applyDelta() {
>>>>>>> origin
    throw new Error(UNSUPPORTED_MSG + 'applyDelta');
  }

  sliceToDelta() {
    throw new Error(UNSUPPORTED_MSG + 'sliceToDelta');
  }
}

export class TextEntity {
  private _yText: Y.Text;
  constructor(yText: Y.Text) {
    this._yText = yText;
  }

  clone() {
    return new TextEntity(this._yText.clone());
  }

  split(index: number): [PrelimTextEntity, PrelimTextEntity] {
    return [
      new PrelimTextEntity('splitLeft', index),
      new PrelimTextEntity('splitRight', index),
    ];
  }

  insert(content: string, index: number) {
    this._yText.insert(index, content);
    // @ts-ignore
    this._yText.meta = { split: true };
  }

  join(other: TextEntity) {
    const yOther = other._yText;
    const delta = yOther.toDelta();
    delta.splice(0, 0, { retain: this._yText.length });
    this._yText.applyDelta(delta);
    // @ts-ignore
    this._yText.meta = { join: true };
  }

  format(index: number, length: number, format: any) {
    this._yText.format(index, length, format);
    // @ts-ignore
    this._yText.meta = { format: true };
  }

  clear() {
    this._yText.delete(0, this._yText.length);
    // @ts-ignore
    this._yText.meta = { clear: true };
  }

  applyDelta(delta: any) {
    this._yText.applyDelta(delta);
  }

  toDelta() {
    return this._yText.toDelta();
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
    return this._yText.toString();
  }
}

export class RichTextAdapter {
  readonly store: Store;
  readonly doc: Y.Doc;
  readonly yText: Y.Text;
  readonly quill: Quill;
  readonly quillCursors: any;
  readonly awareness: AwarenessAdapter;
  private _negatedUsedFormats: Record<string, any>;

  constructor(store: Store, yText: Y.Text, quill: Quill) {
    this.store = store;
    this.yText = yText;
    this.doc = store.doc;
    this.quill = quill;

    this.awareness = store.awareness;
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
    // @ts-ignore
    const isControlledOperation = !!event.target?.meta;

    // update quill if the change is from remote or using controlled operation
    if (isFromRemote || isControlledOperation) {
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
    _eventType: string,
    delta: any,
    _state: any,
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
        this.store.transact(() => {
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
