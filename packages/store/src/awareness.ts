import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { RelativePosition } from 'yjs';
import type { Store } from './store';
import { Signal } from './utils/signal';

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

interface AwarenessDiff {
  added: number[];
  removed: number[];
  updated: number[];
}

export class AwarenessAdapter {
  readonly store: Store;
  readonly awarenessList: Awareness[];
  readonly localAwareness: Awareness;

  readonly signals = {
    update: new Signal<AwarenessMessage>(),
  };

  private _listeners: Array<(diff: AwarenessDiff) => void> = [];

  constructor(store: Store, awarenessList: Awareness[] = []) {
    this.store = store;
    this.localAwareness = new Awareness(store.doc);
    this.awarenessList = [this.localAwareness, ...awarenessList];

    this.awarenessList.forEach(awareness => {
      const listenerCallback = this._onAwarenessChange.bind(this, awareness);
      this._listeners.push(listenerCallback);
      awareness.on('change', listenerCallback);
    });

    this.signals.update.on(this._onAwarenessMessage);
  }

  public setLocalCursor(range: SelectionRange) {
    this.awarenessList.forEach(awareness => {
      awareness.setLocalStateField('cursor', range);
    });
  }

  public getLocalCursor(): SelectionRange | undefined {
    const states = this.localAwareness.getStates();
    const awarenessState = states.get(this.localAwareness.clientID);
    return awarenessState?.cursor;
  }

  public getStates(): Map<number, AwarenessState> {
    return this.localAwareness.getStates() as Map<number, AwarenessState>;
  }

  private _onAwarenessChange = (awareness: Awareness, diff: AwarenessDiff) => {
    const { added, removed, updated } = diff;

    const states = awareness.getStates();
    added.forEach(id => {
      this.signals.update.emit({
        id,
        type: 'add',
        state: states.get(id) as AwarenessState,
      });
    });
    updated.forEach(id => {
      this.signals.update.emit({
        id,
        type: 'update',
        state: states.get(id) as AwarenessState,
      });
    });
    removed.forEach(id => {
      this.signals.update.emit({
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
    this._listeners.forEach((listener, i) => {
      this.awarenessList[i].off('change', listener);
    });
    this.signals.update.dispose();
  }
}
