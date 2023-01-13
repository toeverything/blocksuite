import * as Y from 'yjs';
import type { RelativePosition } from 'yjs';
import type { Awareness } from 'y-protocols/awareness.js';
import type { Space } from './space.js';
import { Signal } from './utils/signal.js';
import { assertExists } from './utils/utils.js';
import { merge } from 'merge';
import { uuidv4 } from './utils/id-generator.js';

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

type Request<
  Flags extends Record<string, unknown> = BlockSuiteFlags,
  Key extends keyof Flags = keyof Flags
> = {
  id: string;
  clientId: number;
  field: Key;
  value: Flags[Key];
};

type Response = {
  id: string;
};

interface AwarenessState<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> {
  cursor?: SelectionRange;
  user?: UserInfo;
  flags: Flags;
  /**
   * flag request to others
   * debug use only.
   */
  changeRequest?: Request<Flags>[];
  changeResponse?: Response[];
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

  setRemoteFlag<Key extends keyof Flags>(
    clientId: number,
    field: Key,
    value: Flags[Key]
  ) {
    const oldRequest = this.awareness.getLocalState()?.request ?? [];
    this.awareness.setLocalStateField('request', [
      ...oldRequest,
      {
        id: uuidv4(),
        clientId,
        field,
        value,
      },
    ] satisfies Request<Flags>[]);
  }

  public getLocalCursor(): SelectionRange | undefined {
    const states = this.awareness.getStates();
    const awarenessState = states.get(this.awareness.clientID);
    return awarenessState?.cursor;
  }

  public getStates(): Map<number, AwarenessState<Flags>> {
    return this.awareness.getStates() as Map<number, AwarenessState<Flags>>;
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
    this._handleRemoteFlags();
  };

  private _handleRemoteFlags() {
    const nextTick: (() => void)[] = [];
    const localState = this.awareness.getLocalState();
    const request = (this.awareness.getLocalState()?.request ??
      []) as Request<Flags>[];
    const selfResponse = [] as Response[];
    const fakeDirtyResponse = [] as Response[];
    if (localState && Array.isArray(localState.response)) {
      selfResponse.push(...localState.response);
      fakeDirtyResponse.push(...localState.response);
    }
    const response = [] as Response[];
    for (const [clientId, state] of this.awareness.getStates()) {
      if (clientId === this.awareness.clientID) {
        continue;
      }
      if (Array.isArray(state.response)) {
        response.push(...state.response);
      }
      if (Array.isArray(state.request)) {
        const remoteRequest = state.request as Request<Flags>[];
        selfResponse.forEach((response, idx) => {
          if (response === null) {
            return;
          }
          const index = remoteRequest.findIndex(
            request => request.id === response.id
          );
          if (index === -1) {
            fakeDirtyResponse[idx].id = 'remove';
          }
        });
        remoteRequest.forEach(request => {
          if (request.clientId === this.awareness.clientID) {
            // handle request
            nextTick.push(() => {
              this.setFlag(request.field, request.value);
            });
            selfResponse.push({
              id: request.id,
            });
          }
        });
      }
    }
    response.forEach(response => {
      const idx = request.findIndex(request => request.id === response.id);
      if (idx !== -1) {
        request.splice(idx, 1);
      }
    });
    nextTick.push(() => {
      this.awareness.setLocalStateField('request', request);
      this.awareness.setLocalStateField(
        'response',
        selfResponse.filter((response, idx) =>
          fakeDirtyResponse[idx] ? fakeDirtyResponse[idx].id !== 'remove' : true
        )
      );
    });

    setTimeout(() => {
      nextTick.forEach(fn => fn());
    }, 100);
  }

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
