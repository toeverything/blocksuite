import * as Y from 'yjs';
import type { RelativePosition } from 'yjs';
import type { Awareness } from 'y-protocols/awareness.js';
import type { Space } from './space.js';
import { Signal } from './utils/signal.js';
import { assertExists } from './utils/utils.js';
import { merge } from 'merge';

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

interface AwarenessState<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> {
  cursor?: SelectionRange;
  user?: UserInfo;
  flags: Flags;
}

interface AwarenessMessage<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> {
  id: number;
  type: 'add' | 'update' | 'remove';
  state?: AwarenessState<Flags>;
}

export interface AwarenessMetadataMessage<
  Flags extends Record<string, unknown> = BlockSuiteFlags,
  Key extends keyof Flags = keyof Flags
> {
  field: Key;
  value: Flags[Key];
}

export class AwarenessAdapter<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly space: Space<any, Flags>;
  readonly awareness: Awareness;

  readonly signals = {
    update: new Signal<AwarenessMessage<Flags>>(),
  };

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    space: Space<any, Flags>,
    awareness: Awareness,
    defaultFlags: Partial<Flags> = {}
  ) {
    this.space = space;
    this.awareness = awareness;
    this.awareness.on('change', this._onAwarenessChange);
    this.signals.update.on(this._onAwarenessMessage);
    const upstreamFlags = awareness.getLocalState()?.flags;
    if (upstreamFlags) {
      this.awareness.setLocalStateField(
        'flags',
        merge(defaultFlags, upstreamFlags)
      );
    } else {
      this.awareness.setLocalStateField('flags', { ...defaultFlags });
    }
  }

  public setLocalCursor(range: SelectionRange) {
    this.awareness.setLocalStateField('cursor', range);
  }

  public setFlag<Key extends keyof Flags>(field: Key, value: Flags[Key]) {
    const oldFlags = this.awareness.getLocalState()?.flags ?? {};
    this.awareness.setLocalStateField('flags', { ...oldFlags, [field]: value });
  }

  public getFlag<Key extends keyof Flags>(field: Key) {
    const flags = this.awareness.getLocalState()?.flags;
    assertExists(flags);
    return flags[field];
  }

  public setReadonly(value: boolean): void {
    const flags = this.getFlag('readonly');
    this.setFlag('readonly', { ...flags, [this.space.prefixedId]: value });
  }

  public isReadonly(): boolean {
    return this.getFlag('readonly')[this.space.prefixedId] ?? false;
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
        state: states.get(id) as AwarenessState<Flags>,
      });
    });
    updated.forEach(id => {
      this.signals.update.emit({
        id,
        type: 'update',
        state: states.get(id) as AwarenessState<Flags>,
      });
    });
    removed.forEach(id => {
      this.signals.update.emit({
        id,
        type: 'remove',
      });
    });
  };

  private _onAwarenessMessage = (awMsg: AwarenessMessage<Flags>) => {
    if (awMsg.id === this.awareness.clientID) {
      this.updateLocalCursor();
    } else {
      this._resetRemoteCursor();
    }
  };

  private _resetRemoteCursor() {
    this.space.richTextAdapters.forEach(textAdapter =>
      textAdapter.quillCursors.clearCursors()
    );
    this.getStates().forEach((awState, clientId) => {
      if (clientId !== this.awareness.clientID && awState.cursor) {
        const anchor = Y.createAbsolutePositionFromRelativePosition(
          awState.cursor.anchor,
          this.space.doc
        );
        const focus = Y.createAbsolutePositionFromRelativePosition(
          awState.cursor.focus,
          this.space.doc
        );
        const textAdapter = this.space.richTextAdapters.get(
          awState.cursor.id || ''
        );
        if (anchor && focus && textAdapter) {
          const user: Partial<UserInfo> = awState.user || {};
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
      this.space.doc
    );
    const focus = Y.createAbsolutePositionFromRelativePosition(
      localCursor.focus,
      this.space.doc
    );
    if (anchor && focus) {
      const textAdapter = this.space.richTextAdapters.get(localCursor.id || '');
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
