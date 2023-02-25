import { Signal } from '@blocksuite/global/utils';
import { merge } from 'merge';
import type { Awareness as YAwareness } from 'y-protocols/awareness.js';
import type { RelativePosition } from 'yjs';
import * as Y from 'yjs';

import type { Space } from './space.js';
import type { Store } from './store.js';
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

// Raw JSON state in awareness CRDT
export type RawAwarenessState<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> = {
  cursor?: Record<Space['prefixedId'], SelectionRange>;
  user?: UserInfo;
  flags: Flags;
  request?: Request<Flags>[];
  response?: Response[];
  /**
   * After insert a blob block with cloud sync,
   * uploading will trigger automatically,
   * blob id will add to this property,
   * and will remove after finish.
   */
  blobUploading?: string[];
};

interface AwarenessEvent<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> {
  id: number;
  type: 'add' | 'update' | 'remove';
  state?: RawAwarenessState<Flags>;
}

export enum BlobUploadState {
  Uploading = 0,
  Uploaded = 1,
}

export class AwarenessStore<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> {
  readonly awareness: YAwareness<RawAwarenessState<Flags>>;
  readonly store: Store;

  readonly signals = {
    update: new Signal<AwarenessEvent<Flags>>(),
  };

  constructor(
    store: Store,
    awareness: YAwareness<RawAwarenessState<Flags>>,
    defaultFlags: Flags
  ) {
    this.store = store;
    this.awareness = awareness;
    this.awareness.on('change', this._onAwarenessChange);
    this.signals.update.on(this._onAwarenessMessage);
    const upstreamFlags = awareness.getLocalState()?.flags;
    if (upstreamFlags) {
      this.awareness.setLocalStateField(
        'flags',
        merge(true, defaultFlags, upstreamFlags)
      );
    } else {
      this.awareness.setLocalStateField('flags', { ...defaultFlags });
    }
  }

  setFlag<Key extends keyof Flags>(field: Key, value: Flags[Key]) {
    const oldFlags = this.awareness.getLocalState()?.flags ?? {};
    this.awareness.setLocalStateField('flags', { ...oldFlags, [field]: value });
  }

  getFlag<Key extends keyof Flags>(field: Key): Flags[Key] | undefined {
    const flags = this.awareness.getLocalState()?.flags ?? {};
    return flags[field];
  }

  setReadonly(space: Space, value: boolean): void {
    const flags = this.getFlag('readonly') ?? {};
    this.setFlag('readonly', {
      ...flags,
      [space.prefixedId]: value,
    } as Flags['readonly']);
  }

  isReadonly(space: Space): boolean {
    const rd = this.getFlag('readonly');
    if (rd && typeof rd === 'object') {
      return Boolean((rd as Record<string, boolean>)[space.prefixedId]);
    } else {
      return false;
    }
  }

  setBlobState(blobId: string, state: BlobUploadState) {
    const uploading = [
      ...(this.awareness.getLocalState()?.blobUploading ?? []),
    ];

    if (state === BlobUploadState.Uploading) {
      if (!uploading.includes(blobId)) {
        uploading.push(blobId);
      }
    } else if (state === BlobUploadState.Uploaded) {
      const position = uploading.findIndex(id => id === blobId);
      if (position > -1) {
        uploading.splice(position, 1);
      }
    }

    this.awareness.setLocalStateField('blobUploading', uploading);
  }

  getBlobState(blobId: string) {
    // FIXME: if clientA and clientB both upload a same image,
    // both clients could not show image correctly.
    const found = [...this.awareness.getStates().entries()].find(
      ([clientId, state]) => {
        // assume local blob always exist, because we cache it in indexedDB
        if (clientId === this.awareness.clientID) {
          return;
        }

        const uploading: string[] = state?.blobUploading ?? [];
        return uploading.includes(blobId);
      }
    );

    return found ? BlobUploadState.Uploading : BlobUploadState.Uploaded;
  }

  isBlobUploading(blobId: string) {
    return this.getBlobState(blobId) === BlobUploadState.Uploading;
  }

  setRemoteFlag<Key extends keyof Flags>(
    clientId: number,
    field: Key,
    value: Flags[Key]
  ) {
    if (!this.getFlag('enable_set_remote_flag')) {
      console.error('set remote flag feature disabled');
      return;
    }
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

  setLocalCursor(space: Space, range: SelectionRange | null) {
    const cursor = this.awareness.getLocalState()?.cursor ?? {};
    if (range === null) {
      delete cursor[space.prefixedId];
      this.awareness.setLocalStateField('cursor', cursor);
    } else {
      this.awareness.setLocalStateField('cursor', {
        ...cursor,
        [space.prefixedId]: range,
      });
    }
  }

  getLocalCursor(space: Space): SelectionRange | undefined {
    return this.awareness.getLocalState()?.['cursor']?.[space.prefixedId];
  }

  getStates(): Map<number, RawAwarenessState<Flags>> {
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
      this.signals.update.emit({
        id,
        type: 'add',
        state: states.get(id) as RawAwarenessState<Flags>,
      });
    });
    updated.forEach(id => {
      this.signals.update.emit({
        id,
        type: 'update',
        state: states.get(id) as RawAwarenessState<Flags>,
      });
    });
    removed.forEach(id => {
      this.signals.update.emit({
        id,
        type: 'remove',
      });
    });
  };

  private _onAwarenessMessage = (awMsg: AwarenessEvent<Flags>) => {
    if (awMsg.id === this.awareness.clientID) {
      this.store.spaces.forEach(space => this.updateLocalCursor(space));
    } else {
      this._resetRemoteCursor();
    }
    if (this.getFlag('enable_set_remote_flag') === true) {
      this._handleRemoteFlags();
    }
  };

  private _handleRemoteFlags() {
    const nextTick: (() => void)[] = [];
    const localState =
      this.awareness.getLocalState() as RawAwarenessState<Flags>;
    const request = (localState?.request ?? []) as Request<Flags>[];
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
    const states = this.getStates();
    this.store.spaces.forEach(space => {
      states.forEach((awState, clientId) => {
        if (clientId === this.awareness.clientID) {
          return;
        }
        const cursor = awState.cursor?.[space.prefixedId];
        if (cursor) {
          space.richTextAdapters.forEach(textAdapter =>
            textAdapter.quillCursors.clearCursors()
          );
          const anchor = Y.createAbsolutePositionFromRelativePosition(
            cursor.anchor,
            space.doc
          );
          const focus = Y.createAbsolutePositionFromRelativePosition(
            cursor.focus,
            space.doc
          );
          const textAdapter = space.richTextAdapters.get(cursor.id || '');
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
    });
  }

  updateLocalCursor(space: Space) {
    const localCursor = this.getLocalCursor(space);
    if (!localCursor) {
      return;
    }
    const anchor = Y.createAbsolutePositionFromRelativePosition(
      localCursor.anchor,
      space.doc
    );
    const focus = Y.createAbsolutePositionFromRelativePosition(
      localCursor.focus,
      space.doc
    );
    if (anchor && focus) {
      const textAdapter = space.richTextAdapters.get(localCursor.id || '');
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
