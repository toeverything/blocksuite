import { Awareness } from 'y-protocols/awareness.js';
import { RelativePosition } from 'yjs';
import type { Store } from './store';
import { Slot } from './utils/slot';

export interface SelectionRange {
  id: string;
  anchor: RelativePosition;
  focus: RelativePosition;
}

export interface AwarenessState {
  cursor: SelectionRange;
}

export interface AwarenessMessage {
  id: number;
  type: 'add' | 'update' | 'remove';
  state?: AwarenessState;
}

export class YAwareness {
  readonly store: Store;
  readonly awareness: Awareness;

  readonly slots = {
    update: new Slot<AwarenessMessage>(),
  };

  constructor(store: Store) {
    this.store = store;
    this.awareness = store.provider.awareness;
    this.awareness.on('change', this._onAwarenessChange);
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

  destroy() {
    if (this.awareness) {
      this.awareness.off('change', this._onAwarenessChange);
    }
  }
}
