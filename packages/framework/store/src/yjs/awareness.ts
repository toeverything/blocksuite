import type { BlockSuiteFlags } from '@blocksuite/global/types';
import type { Awareness as YAwareness } from 'y-protocols/awareness.js';

import { Slot } from '@blocksuite/global/utils';
import { type Signal, signal } from '@preact/signals-core';
import clonedeep from 'lodash.clonedeep';
import merge from 'lodash.merge';

import type { BlockCollection } from '../store/index.js';

export interface UserInfo {
  name: string;
}

type UserSelection = Array<Record<string, unknown>>;

// Raw JSON state in awareness CRDT
export type RawAwarenessState<Flags extends BlockSuiteFlags = BlockSuiteFlags> =
  {
    user?: UserInfo;
    color?: string;
    flags: Flags;
    // use v2 to avoid crush on old clients
    selectionV2: Record<string, UserSelection>;
  };

export interface AwarenessEvent<
  Flags extends BlockSuiteFlags = BlockSuiteFlags,
> {
  id: number;
  type: 'add' | 'update' | 'remove';
  state?: RawAwarenessState<Flags>;
}

export class AwarenessStore<Flags extends BlockSuiteFlags = BlockSuiteFlags> {
  private _flags: Signal<Flags>;

  private _onAwarenessChange = (diff: {
    added: number[];
    removed: number[];
    updated: number[];
  }) => {
    this._flags.value = this.awareness.getLocalState()?.flags ?? {};

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

  readonly awareness: YAwareness<RawAwarenessState<Flags>>;

  readonly slots = {
    update: new Slot<AwarenessEvent<Flags>>(),
  };

  constructor(
    awareness: YAwareness<RawAwarenessState<Flags>>,
    defaultFlags: Flags
  ) {
    this._flags = signal<Flags>(defaultFlags);
    this.awareness = awareness;
    this.awareness.on('change', this._onAwarenessChange);
    this.awareness.setLocalStateField('selectionV2', {});
    this._initFlags(defaultFlags);
  }

  private _initFlags(defaultFlags: Flags) {
    const upstreamFlags = this.awareness.getLocalState()?.flags;
    const flags = clonedeep(defaultFlags);
    if (upstreamFlags) {
      merge(flags, upstreamFlags);
    }
    this.awareness.setLocalStateField('flags', flags);
  }

  destroy() {
    if (this.awareness) {
      this.awareness.off('change', this._onAwarenessChange);
      this.slots.update.dispose();
    }
  }

  getFlag<Key extends keyof Flags>(field: Key) {
    return this._flags.value[field];
  }

  getLocalSelection(
    selectionManagerId: string
  ): ReadonlyArray<Record<string, unknown>> {
    return (
      (this.awareness.getLocalState()?.selectionV2 ?? {})[selectionManagerId] ??
      []
    );
  }

  getStates(): Map<number, RawAwarenessState<Flags>> {
    return this.awareness.getStates();
  }

  isReadonly(blockCollection: BlockCollection): boolean {
    const rd = this.getFlag('readonly');
    if (rd && typeof rd === 'object') {
      return Boolean((rd as Record<string, boolean>)[blockCollection.id]);
    } else {
      return false;
    }
  }

  setFlag<Key extends keyof Flags>(field: Key, value: Flags[Key]) {
    const oldFlags = this.awareness.getLocalState()?.flags ?? {};
    this.awareness.setLocalStateField('flags', { ...oldFlags, [field]: value });
  }

  setLocalSelection(selectionManagerId: string, selection: UserSelection) {
    const oldSelection = this.awareness.getLocalState()?.selectionV2 ?? {};
    this.awareness.setLocalStateField('selectionV2', {
      ...oldSelection,
      [selectionManagerId]: selection,
    });
  }

  setReadonly(blockCollection: BlockCollection, value: boolean): void {
    const flags = this.getFlag('readonly') ?? {};
    this.setFlag('readonly', {
      ...flags,
      [blockCollection.id]: value,
    } as Flags['readonly']);
  }
}
