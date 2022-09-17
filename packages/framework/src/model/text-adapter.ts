/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Y from 'yjs';
import { AwarenessManager } from './awareness';
import type { Quill } from 'quill';
import type { Store } from './store';

// Removes the pending '\n's if it has no attributes
export const normQuillDelta = (delta: any) => {
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
};

export class TextAdapter {
  readonly store: Store;
  readonly doc: Y.Doc;
  readonly yText: Y.Text;
  readonly quill: Quill;
  readonly quillCursors: any;
  readonly awareness: AwarenessManager;
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

    this.store.slots.updateText.on(event => {
      this._yObserver(event);
    });

    quill.on('editor-change', this._quillObserver as any);
    // This indirectly initializes _negatedUsedFormats.
    // Make sure that this call this after the _quillObserver is set.
    quill.setContents(yText.toDelta(), this as any);
  }

  private _yObserver = (event: Y.YTextEvent) => {
    // Should listen to global text event instead the curent yText instance,
    // since an empty yText on yMap can be replaced by another yText.
    if (event.target.parent !== this.yText.parent) {
      return;
    }

    // remote update doesn't carry clientID
    if (event.transaction.origin !== this.doc.clientID) {
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
    }
  };

  private _quillObserver = (_: string, delta: any, _old: any, origin: any) => {
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
