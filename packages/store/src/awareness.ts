import { Slot } from '@blocksuite/global/utils';
import { merge } from 'merge';
import type { Awareness as YAwareness } from 'y-protocols/awareness.js';

import type { Space } from './space.js';
import type { Store } from './store.js';

export interface UserRange {
  startOffset: number;
  endOffset: number;
  blockIds: string[];
}

export interface UserInfo {
  id: number;
  name: string;
  color: string;
}

// Raw JSON state in awareness CRDT
export type RawAwarenessState<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> = {
  rangeMap?: Record<string, UserRange>;
  user?: UserInfo;
  flags: Flags;
  selection: Array<Record<string, unknown>>;
};

interface AwarenessEvent<
  Flags extends Record<string, unknown> = BlockSuiteFlags
> {
  id: number;
  type: 'add' | 'update' | 'remove';
  state?: RawAwarenessState<Flags>;
}

export class AwarenessStore<
  Flags extends Record<string, unknown> = BlockSuiteFlags
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
    this.awareness.setLocalStateField('selection', []);
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

  setLocalRange(space: Space, range: UserRange | null) {
    const rangeMap = this.awareness.getLocalState()?.rangeMap ?? {};
    if (range === null) {
      delete rangeMap[space.prefixedId];
      this.awareness.setLocalStateField('rangeMap', rangeMap);
    } else {
      this.awareness.setLocalStateField('rangeMap', {
        ...rangeMap,
        [space.prefixedId]: range,
      });
    }
  }

  getLocalRange(space: Space): UserRange | undefined {
    return this.awareness.getLocalState()?.['rangeMap']?.[space.prefixedId];
  }

  setLocalSelection(selection: Array<Record<string, unknown>>) {
    this.awareness.setLocalStateField('selection', selection);
  }

  getLocalSelection(): ReadonlyArray<Record<string, unknown>> {
    return this.awareness.getLocalState()?.selection || [];
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
