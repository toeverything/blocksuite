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

interface UserInfo {
  id: number;
  name: string;
  color: string;
}

interface AwarenessState {
  cursor?: SelectionRange;
  user: UserInfo;
}

interface AwarenessMessage {
  id: number;
  type: 'add' | 'update' | 'remove';
  state?: AwarenessState;
}

export class AwarenessAdapter {
  readonly store: Store;
  readonly awarenessList: Awareness[];
  readonly localAwareness: Awareness;

  readonly slots = {
    update: new Slot<AwarenessMessage>(),
  };

  private _listenerHandlers: Array<{ destroy: () => void }> = [];

  constructor(store: Store, awarenessList?: Awareness[]) {
    this.store = store;
    this.localAwareness = new Awareness(store.doc);
    this.awarenessList = [this.localAwareness].concat(awarenessList || []);

    this._each(awareness => {
      const listenerCallback = this._onAwarenessChange.bind(this, awareness);
      awareness.on('change', listenerCallback);
      this._listenerHandlers.push({
        destroy: () => {
          awareness.off('change', listenerCallback);
        },
      });
    });

    this.slots.update.on(this._onAwarenessMessage);
  }

  public setLocalCursor(range: SelectionRange) {
    this._each(awareness => awareness.setLocalStateField('cursor', range));
  }

  public getLocalCursor(): SelectionRange | undefined {
    const states = this.localAwareness.getStates();
    const awarenessState = states.get(this.localAwareness.clientID);
    return awarenessState?.cursor;
  }

  public getStates(): Map<number, AwarenessState> {
    return this.localAwareness.getStates() as Map<number, AwarenessState>;
  }

  private _each(callback: (awareness: Awareness) => void) {
    this.awarenessList.forEach(awareness => callback(awareness));
  }

  private _onAwarenessChange = (
    awareness: Awareness,
    diff: {
      added: number[];
      removed: number[];
      updated: number[];
    }
  ) => {
    const { added, removed, updated } = diff;

    const states = awareness.getStates();
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
    if (awMsg.id === this.localAwareness.clientID) {
      this.updateLocalCursor();
    } else {
      this._resetRemoteCursor();
    }
  };

  private _resetRemoteCursor() {
    this.store.richTextAdapters.forEach(textAdapter =>
      textAdapter.quillCursors.clearCursors()
    );
    this.getStates().forEach((awState, clientId) => {
      if (clientId !== this.localAwareness.clientID && awState.cursor) {
        const anchor = Y.createAbsolutePositionFromRelativePosition(
          awState.cursor.anchor,
          this.store.doc
        );
        const focus = Y.createAbsolutePositionFromRelativePosition(
          awState.cursor.focus,
          this.store.doc
        );
        const textAdapter = this.store.richTextAdapters.get(
          awState.cursor.id || ''
        );
        if (anchor && focus && textAdapter) {
          const user = awState.user || {};
          const color = user.color || '#ffa500';
          const name = user.name || 'other';
          textAdapter.quillCursors.createCursor(
            clientId.toString(),
            name,
            color
          );
          textAdapter.quillCursors.moveCursor(clientId.toString(), {
            index: anchor.index,
            length: focus.index - anchor.index,
          });
        }
      }
    });
  }

  public updateLocalCursor() {
    const localCursor = this.getLocalCursor();
    if (!localCursor) {
      return;
    }
    const anchor = Y.createAbsolutePositionFromRelativePosition(
      localCursor.anchor,
      this.store.doc
    );
    const focus = Y.createAbsolutePositionFromRelativePosition(
      localCursor.focus,
      this.store.doc
    );
    if (anchor && focus) {
      const textAdapter = this.store.richTextAdapters.get(localCursor.id || '');
      textAdapter?.quill.setSelection(anchor.index, focus.index - anchor.index);
    }
  }

  destroy() {
    this._listenerHandlers.forEach(handler => handler.destroy());
    this.slots.update.dispose();
  }
}
