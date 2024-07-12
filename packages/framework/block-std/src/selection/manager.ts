import type { StackItem } from '@blocksuite/store';

import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import { computed, signal } from '@lit-labs/preact-signals';

import type { BaseSelection } from './base.js';

import {
  BlockSelection,
  CursorSelection,
  SurfaceSelection,
  TextSelection,
} from './variants/index.js';

interface SelectionConstructor {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): BaseSelection;
  fromJSON(json: Record<string, unknown>): BaseSelection;
}

export class SelectionManager {
  private _itemAdded = (event: { stackItem: StackItem }) => {
    event.stackItem.meta.set('selection-state', this.value);
  };

  private _itemPopped = (event: { stackItem: StackItem }) => {
    const selection = event.stackItem.meta.get('selection-state');
    if (selection) {
      this.set(selection as BaseSelection[]);
    }
  };

  private _jsonToSelection = (json: Record<string, unknown>) => {
    const ctor = this._selectionConstructors[json.type as string];
    if (!ctor) {
      throw new Error(`Unknown selection type: ${json.type}`);
    }
    return ctor.fromJSON(json);
  };

  private _remoteSelections = signal<Map<number, BaseSelection[]>>(new Map());

  private _selectionConstructors: Record<string, SelectionConstructor> = {};

  private _selections = signal<BaseSelection[]>([]);

  disposables = new DisposableGroup();

  slots = {
    changed: new Slot<BaseSelection[]>(),
    remoteChanged: new Slot<Map<number, BaseSelection[]>>(),
  };

  constructor(public std: BlockSuite.Std) {
    this._setupDefaultSelections();
    this._store.awareness.on(
      'change',
      (change: { updated: number[]; added: number[]; removed: number[] }) => {
        const all = change.updated.concat(change.added).concat(change.removed);
        const localClientID = this._store.awareness.clientID;
        const exceptLocal = all.filter(id => id !== localClientID);
        const hasLocal = all.includes(localClientID);
        if (hasLocal) {
          const localSelection = this._store
            .getLocalSelection(this.std.doc.blockCollection)
            .map(json => {
              return this._jsonToSelection(json);
            });
          this._selections.value = localSelection;
        }

        if (exceptLocal.length > 0) {
          const map = new Map<number, BaseSelection[]>();
          this._store.getStates().forEach((state, id) => {
            if (id === this._store.awareness.clientID) return;
            const selection = Object.entries(state.selectionV2)
              .filter(([key]) => key === this.std.doc.id)
              .flatMap(([_, selection]) => selection);
            const selections = selection
              .map(json => {
                try {
                  return this._jsonToSelection(json);
                } catch (error) {
                  console.error(
                    'Parse remote selection failed:',
                    id,
                    json,
                    error
                  );
                  return null;
                }
              })
              .filter((sel): sel is BaseSelection => !!sel);
            map.set(id, selections);
          });
          this._remoteSelections.value = map;
        }
      }
    );
  }

  private _setupDefaultSelections() {
    this.register([
      TextSelection,
      BlockSelection,
      SurfaceSelection,
      CursorSelection,
    ]);
  }

  private get _store() {
    return this.std.collection.awarenessStore;
  }

  clear(types?: string[]) {
    if (types) {
      const values = this.value.filter(
        selection => !types.includes(selection.type)
      );
      this.set(values);
    } else {
      this.set([]);
    }
  }

  create<T extends BlockSuite.SelectionType>(
    type: T,
    ...args: ConstructorParameters<BlockSuite.Selection[T]>
  ): BlockSuite.SelectionInstance[T] {
    const ctor = this._selectionConstructors[type];
    if (!ctor) {
      throw new Error(`Unknown selection type: ${type}`);
    }
    return new ctor(...args) as BlockSuite.SelectionInstance[T];
  }

  dispose() {
    Object.values(this.slots).forEach(slot => slot.dispose());
    this.disposables.dispose();
  }

  filter<T extends BlockSuite.SelectionType>(type: T) {
    return this.filter$(type).value;
  }

  filter$<T extends BlockSuite.SelectionType>(type: T) {
    return computed(() =>
      this.value.filter((sel): sel is BlockSuite.SelectionInstance[T] =>
        sel.is(type)
      )
    );
  }

  find<T extends BlockSuite.SelectionType>(type: T) {
    return this.find$(type).value;
  }

  find$<T extends BlockSuite.SelectionType>(type: T) {
    return computed(() =>
      this.value.find((sel): sel is BlockSuite.SelectionInstance[T] =>
        sel.is(type)
      )
    );
  }

  fromJSON(json: Record<string, unknown>[]) {
    const selections = json.map(json => {
      return this._jsonToSelection(json);
    });
    return this.set(selections);
  }

  getGroup(group: string) {
    return this.value.filter(s => s.group === group);
  }

  mount() {
    if (this.disposables.disposed) {
      this.disposables = new DisposableGroup();
    }
    this.std.doc.history.on('stack-item-added', this._itemAdded);
    this.std.doc.history.on('stack-item-popped', this._itemPopped);
    this.disposables.add(
      this._store.slots.update.on(({ id }) => {
        if (id === this._store.awareness.clientID) return;
        this.slots.remoteChanged.emit(this.remoteSelections);
      })
    );
  }

  register(ctor: SelectionConstructor | SelectionConstructor[]) {
    [ctor].flat().forEach(ctor => {
      this._selectionConstructors[ctor.type] = ctor;
    });
    return this;
  }

  set(selections: BaseSelection[]) {
    this._store.setLocalSelection(
      this.std.doc.blockCollection,
      selections.map(s => s.toJSON())
    );
    this.slots.changed.emit(selections);
  }

  setGroup(group: string, selections: BaseSelection[]) {
    const current = this.value.filter(s => s.group !== group);
    this.set([...current, ...selections]);
  }

  unmount() {
    this.std.doc.history.off('stack-item-added', this._itemAdded);
    this.std.doc.history.off('stack-item-popped', this._itemPopped);
    this.slots.changed.dispose();
    this.disposables.dispose();
    this.clear();
  }

  update(fn: (currentSelections: BaseSelection[]) => BaseSelection[]) {
    const selections = fn(this.value);
    this.set(selections);
  }

  get remoteSelections() {
    return this._remoteSelections.value;
  }

  get value() {
    return this._selections.value;
  }
}
