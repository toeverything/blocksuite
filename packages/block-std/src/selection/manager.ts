import type { StackItem } from '@blocksuite/store';
import { DisposableGroup, Slot } from '@blocksuite/store';

import type { BlockStore } from '../store/index.js';
import type { BaseSelection } from './base.js';
import { BlockSelection, TextSelection } from './variants/index.js';

interface SelectionConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): BaseSelection;

  type: string;
  fromJSON(json: Record<string, unknown>): BaseSelection;
}

export class SelectionManager {
  disposables = new DisposableGroup();
  private _selectionConstructors: Record<string, SelectionConstructor> = {};

  slots = {
    changed: new Slot<BaseSelection[]>(),
  };

  constructor(public blockStore: BlockStore) {
    this._setupDefaultSelections();
  }

  register(ctor: SelectionConstructor | SelectionConstructor[]) {
    [ctor].flat().forEach(ctor => {
      this._selectionConstructors[ctor.type] = ctor;
    });
    return this;
  }

  private get _store() {
    return this.blockStore.workspace.awarenessStore;
  }

  private _setupDefaultSelections() {
    this.register([TextSelection, BlockSelection]);
  }

  getInstance<T extends BlockSuiteSelectionType>(
    type: T,
    ...args: ConstructorParameters<BlockSuiteSelection[T]>
  ): BlockSuiteSelectionInstance[T] {
    const ctor = this._selectionConstructors[type];
    if (!ctor) {
      throw new Error(`Unknown selection type: ${type}`);
    }
    return new ctor(...args) as BlockSuiteSelectionInstance[T];
  }

  get value() {
    return this._store.getLocalSelection().map(json => {
      const ctor = this._selectionConstructors[json.type as string];
      if (!ctor) {
        throw new Error(`Unknown selection type: ${json.type}`);
      }
      return ctor.fromJSON(json);
    });
  }

  set(selections: BaseSelection[]) {
    this._store.setLocalSelection(selections.map(s => s.toJSON()));
    this.slots.changed.emit(selections);
  }

  update(fn: (currentSelections: BaseSelection[]) => BaseSelection[]) {
    const selections = fn(this.value);
    this.set(selections);
  }

  clear() {
    this.set([]);
  }

  get remoteSelections() {
    return Object.fromEntries(
      Array.from(this._store.getStates().entries())
        .filter(([key]) => key !== this._store.awareness.clientID)
        .map(([key, value]) => [key, value.selection] as const)
    );
  }

  mount() {
    if (this.disposables.disposed) {
      this.disposables = new DisposableGroup();
    }
    this.blockStore.page.history.on(
      'stack-item-added',
      (event: { stackItem: StackItem }) => {
        event.stackItem.meta.set('selection-state', this.value);
      }
    );
    this.blockStore.page.history.on(
      'stack-item-popped',
      (event: { stackItem: StackItem }) => {
        const selection = event.stackItem.meta.get('selection-state');
        if (selection) {
          this.set(selection as BaseSelection[]);
        }
      }
    );
  }

  unmount() {
    this.clear();
    this.slots.changed.dispose();
    this.disposables.dispose();
  }

  dispose() {
    Object.values(this.slots).forEach(slot => slot.dispose());
    this.disposables.dispose();
  }
}
