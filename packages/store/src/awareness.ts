import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { RelativePosition } from 'yjs';
import type { Store } from './store';
import { Slot } from './utils/slot';

export interface SelectionRange {
  id: string;
  anchor: RelativePosition;
  focus: RelativePosition;
}

interface AwarenessState {
  cursor: SelectionRange;
}

interface AwarenessMessage {
  id: number;
  type: 'add' | 'update' | 'remove';
  state?: AwarenessState;
}

export class AwarenessAdapter {
  readonly store: Store;
  readonly awareness: Awareness;

  readonly slots = {
    update: new Slot<AwarenessMessage>(),
  };

  constructor(store: Store) {
    this.store = store;
    this.awareness = store.provider.awareness;
    this.awareness.on('change', this._onAwarenessChange);
    this.slots.update.on(this._onAwarenessMessage);
  }

  public setLocalCursor(range: SelectionRange) {
    this.awareness.setLocalStateField('cursor', range);
  }

  public getLocalCursor() {
    const states = this.awareness.getStates();
    const awarenessState = states.get(this.store.doc.clientID);
    return awarenessState?.cursor;
  }

  public getStates() {
    return this.awareness.getStates();
  }

  private _onAwarenessChange = (diff: {
    added: number[];
    removed: number[];
    updated: number[];
  }) => {
    const { added, removed, updated } = diff;

    const states = this.awareness.getStates();
    added.forEach(id => {
      this.slots.update.emit({
        id,
        type: 'add',
        state: states.get(id) as AwarenessState,
      });
    });
    updated.forEach(id => {
      this.slots.update.emit({
        id,
        type: 'update',
        state: states.get(id) as AwarenessState,
      });
    });
    removed.forEach(id => {
      this.slots.update.emit({
        id,
        type: 'remove',
      });
    });
  };

  private _onAwarenessMessage = (awMsg: AwarenessMessage) => {
    if (awMsg.type !== 'remove' && awMsg.state) {
      const anchor = Y.createAbsolutePositionFromRelativePosition(
        awMsg.state?.cursor.anchor,
        this.store.doc
      );
      const focus = Y.createAbsolutePositionFromRelativePosition(
        awMsg.state?.cursor.focus,
        this.store.doc
      );
      if (anchor && focus) {
        const textAdapter = this.store.textAdapters.get(
          awMsg.state?.cursor.id || ''
        );
        textAdapter?.quill.setSelection(
          anchor.index,
          focus.index - anchor.index
        );
      }
    }
  };

  destroy() {
    if (this.awareness) {
      this.awareness.off('change', this._onAwarenessChange);
      this.slots.update.dispose();
    }
  }
}
