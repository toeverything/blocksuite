import { Slot } from '@blocksuite/global/utils';
import { merge } from 'merge';
import type { Awareness as YAwareness } from 'y-protocols/awareness.js';

import type { Space } from '../store/space.js';
import type { Store } from '../store/store.js';

export interface UserInfo {
  name: string;
}

type UserSelection = Array<Record<string, unknown>>;

// Raw JSON state in awareness CRDT
export type RawAwarenessState<
  Flags extends Record<string, unknown> = BlockSuiteFlags,
> = {
  user?: UserInfo;
  color?: string;
  flags: Flags;
  // use v2 to avoid crush on old clients
  selectionV2: Record<string, UserSelection>;
};

export interface AwarenessEvent<
  Flags extends Record<string, unknown> = BlockSuiteFlags,
> {
  id: number;
  type: 'add' | 'update' | 'remove';
  state?: RawAwarenessState<Flags>;
}

export class AwarenessStore<
  Flags extends Record<string, unknown> = BlockSuiteFlags,
> {
  readonly awareness: YAwareness<RawAwarenessState<Flags>>;
  readonly store: Store;

  readonly slots = {
    update: new Slot<AwarenessEvent<Flags>>(),
  };

  constructor(
    store: Store,
    awareness: YAwareness<RawAwarenessState<Flags>>,
    defaultFlags: Flags
  ) {
    this.store = store;
    this.awareness = awareness;
    this.awareness.on('change', this._onAwarenessChange);
    this.awareness.setLocalStateField('selectionV2', {});
    this._initFlags(defaultFlags);
  }

  private _initFlags(defaultFlags: Flags) {
    const upstreamFlags = this.awareness.getLocalState()?.flags;
    const flags = upstreamFlags
      ? merge(true, defaultFlags, upstreamFlags)
      : { ...defaultFlags };
    this.awareness.setLocalStateField('flags', flags);
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
      [space.id]: value,
    } as Flags['readonly']);
  }

  isReadonly(space: Space): boolean {
    const rd = this.getFlag('readonly');
    if (rd && typeof rd === 'object') {
      return Boolean((rd as Record<string, boolean>)[space.id]);
    } else {
      return false;
    }
  }

  setLocalSelection(space: Space, selection: UserSelection) {
    const oldSelection = this.awareness.getLocalState()?.selectionV2 ?? {};
    this.awareness.setLocalStateField('selectionV2', {
      ...oldSelection,
      [space.id]: selection,
    });
  }

  getLocalSelection(space: Space): ReadonlyArray<Record<string, unknown>> {
    return (this.awareness.getLocalState()?.selectionV2 ?? {})[space.id] ?? [];
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
      this.slots.update.emit({
        id,
        type: 'add',
        state: states.get(id),
      });
    });
    updated.forEach(id => {
      this.slots.update.emit({
        id,
        type: 'update',
        state: states.get(id),
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
      this.slots.update.dispose();
    }
  }
}
