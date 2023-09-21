import { DisposableGroup, Slot } from '@blocksuite/global/utils';
import type { StackItem } from '@blocksuite/store';

import type { BlockStdProvider } from '../provider/index.js';
import type { BaseSelection } from './base.js';
import {
  BlockSelection,
  CursorSelection,
  SurfaceSelection,
  TextSelection,
} from './variants/index.js';

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
    remoteChanged: new Slot<Record<string, BaseSelection[]>>(),
  };

  constructor(public std: BlockStdProvider) {
    this._setupDefaultSelections();
  }

  register(ctor: SelectionConstructor | SelectionConstructor[]) {
    [ctor].flat().forEach(ctor => {
      this._selectionConstructors[ctor.type] = ctor;
    });
    return this;
  }

  private get _store() {
    return this.std.workspace.awarenessStore;
  }

  private _setupDefaultSelections() {
    this.register([
      TextSelection,
      BlockSelection,
      SurfaceSelection,
      CursorSelection,
    ]);
  }

  private _jsonToSelection = (json: Record<string, unknown>) => {
    const ctor = this._selectionConstructors[json.type as string];
    if (!ctor) {
      throw new Error(`Unknown selection type: ${json.type}`);
    }
    return ctor.fromJSON(json);
  };

  getInstance<T extends BlockSuite.SelectionType>(
    type: T,
    ...args: ConstructorParameters<BlockSuite.Selection[T]>
  ): BlockSuite.SelectionInstance[T] {
    const ctor = this._selectionConstructors[type];
    if (!ctor) {
      throw new Error(`Unknown selection type: ${type}`);
    }
    return new ctor(...args) as BlockSuite.SelectionInstance[T];
  }

  get value() {
    return this._store.getLocalSelection().map(json => {
      return this._jsonToSelection(json);
    });
  }

  set(selections: BaseSelection[]) {
    this._store.setLocalSelection(selections.map(s => s.toJSON()));
    this.slots.changed.emit(selections);
  }

  setGroup(group: string, selections: BaseSelection[]) {
    const current = this.value.filter(s => s.group !== group);
    this.set([...current, ...selections]);
  }

  getGroup(group: string) {
    return this.value.filter(s => s.group === group);
  }

  update(fn: (currentSelections: BaseSelection[]) => BaseSelection[]) {
    const selections = fn(this.value);
    this.set(selections);
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

  find<T extends BlockSuite.SelectionType>(type: T) {
    return this.value.find((sel): sel is BlockSuite.SelectionInstance[T] =>
      sel.is(type)
    );
  }

  filter<T extends BlockSuite.SelectionType>(type: T) {
    return this.value.filter((sel): sel is BlockSuite.SelectionInstance[T] =>
      sel.is(type)
    );
  }

  get remoteSelections() {
    return Object.fromEntries(
      Array.from(this._store.getStates().entries())
        .filter(([key]) => key !== this._store.awareness.clientID)
        .map(
          ([key, value]) =>
            [key, value.selection.map(this._jsonToSelection)] as const
        )
    );
  }

  private _itemAdded = (event: { stackItem: StackItem }) => {
    event.stackItem.meta.set('selection-state', this.value);
  };

  private _itemPopped = (event: { stackItem: StackItem }) => {
    const selection = event.stackItem.meta.get('selection-state');
    if (selection) {
      this.set(selection as BaseSelection[]);
    }
  };

  mount() {
    if (this.disposables.disposed) {
      this.disposables = new DisposableGroup();
    }
    this.std.page.history.on('stack-item-added', this._itemAdded);
    this.std.page.history.on('stack-item-popped', this._itemPopped);
    this.disposables.add(
      this._store.slots.update.on(({ id }) => {
        if (id === this._store.awareness.clientID) return;
        this.slots.remoteChanged.emit(this.remoteSelections);
      })
    );
  }

  unmount() {
    this.std.page.history.off('stack-item-added', this._itemAdded);
    this.std.page.history.off('stack-item-popped', this._itemPopped);
    this.clear();
    this.slots.changed.dispose();
    this.disposables.dispose();
  }

  dispose() {
    Object.values(this.slots).forEach(slot => slot.dispose());
    this.disposables.dispose();
  }
}
