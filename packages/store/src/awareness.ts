import * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness.js';
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

export class AwarenessAdapter {
  readonly store: Store;
  readonly awareness: Awareness;

  readonly signals = {
    update: new Signal<AwarenessMessage>(),
  };

  constructor(store: Store, awareness: Awareness) {
    this.store = store;
    this.awareness = awareness;
    this.awareness.on('change', this._onAwarenessChange);
    this.signals.update.on(this._onAwarenessMessage);
  }

  public setLocalCursor(range: SelectionRange) {
    this.awareness.setLocalStateField('cursor', range);
  }

  public getLocalCursor(): SelectionRange | undefined {
    const states = this.awareness.getStates();
    const awarenessState = states.get(this.awareness.clientID);
    return awarenessState?.cursor;
  }

  public getStates(): Map<number, AwarenessState> {
    return this.awareness.getStates() as Map<number, AwarenessState>;
  }

  private _onAwarenessChange = (diff: {
    added: number[];
    removed: number[];
    updated: number[];
  }) => {
    const { added, removed, updated } = diff;

    const states = this.awareness.getStates();
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
    if (awMsg.id === this.awareness.clientID) {
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
      if (clientId !== this.awareness.clientID && awState.cursor) {
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
    const localCursor = this.store.awareness.getLocalCursor();
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
    if (this.awareness) {
      this.awareness.off('change', this._onAwarenessChange);
      this.signals.update.dispose();
    }
  }
}
