import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import { nanoid, type StackItem } from '@blocksuite/store';
import { computed, signal } from '@preact/signals-core';

import type { BlockStdScope } from '../scope/index.js';
import type { BaseSelection } from './base.js';

import { LifeCycleWatcher } from '../extension/index.js';
import { SelectionIdentifier } from '../identifier.js';

export interface SelectionConstructor {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): BaseSelection;
  fromJSON(json: Record<string, unknown>): BaseSelection;
}

export class SelectionManager extends LifeCycleWatcher {
  static override readonly key = 'selectionManager';

  private _id: string;

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
      throw new BlockSuiteError(
        ErrorCode.SelectionError,
        `Unknown selection type: ${json.type}`
      );
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

  private get _store() {
    return this.std.collection.awarenessStore;
  }

  get id() {
    return this._id;
  }

  get remoteSelections() {
    return this._remoteSelections.value;
  }

  get value() {
    return this._selections.value;
  }

  constructor(std: BlockStdScope) {
    super(std);
    this._id = `${this.std.doc.blockCollection.id}:${nanoid()}`;
    this._setupDefaultSelections();
    this._store.awareness.on(
      'change',
      (change: { updated: number[]; added: number[]; removed: number[] }) => {
        const all = change.updated.concat(change.added).concat(change.removed);
        const localClientID = this._store.awareness.clientID;
        const exceptLocal = all.filter(id => id !== localClientID);
        const hasLocal = all.includes(localClientID);
        if (hasLocal) {
          const localSelectionJson = this._store.getLocalSelection(this.id);
          const localSelection = localSelectionJson.map(json => {
            return this._jsonToSelection(json);
          });
          this._selections.value = localSelection;
        }

        // Only consider remote selections from other clients
        if (exceptLocal.length > 0) {
          const map = new Map<number, BaseSelection[]>();
          this._store.getStates().forEach((state, id) => {
            if (id === this._store.awareness.clientID) return;
            // selection id starts with the same block collection id from others clients would be considered as remote selections
            const selection = Object.entries(state.selectionV2)
              .filter(([key]) =>
                key.startsWith(this.std.doc.blockCollection.id)
              )
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
    this.std.provider.getAll(SelectionIdentifier).forEach(ctor => {
      this.register(ctor);
    });
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
      throw new BlockSuiteError(
        ErrorCode.SelectionError,
        `Unknown selection type: ${type}`
      );
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

  override mounted() {
    if (this.disposables.disposed) {
      this.disposables = new DisposableGroup();
    }
    this.std.doc.history.on('stack-item-added', this._itemAdded);
    this.std.doc.history.on('stack-item-popped', this._itemPopped);
    this.disposables.add(
      this._store.slots.update.on(({ id }) => {
        if (id === this._store.awareness.clientID) {
          return;
        }
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
      this.id,
      selections.map(s => s.toJSON())
    );
    this.slots.changed.emit(selections);
  }

  setGroup(group: string, selections: BaseSelection[]) {
    const current = this.value.filter(s => s.group !== group);
    this.set([...current, ...selections]);
  }

  override unmounted() {
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
}
