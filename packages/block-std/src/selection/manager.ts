import type { Page, StackItem, Workspace } from '@blocksuite/store';
import { DisposableGroup, Slot } from '@blocksuite/store';
import { createMutex } from 'lib0/mutex.js';

import type { BaseSelection } from './base.js';
import { RangeController } from './range-controller.js';
import { BlockSelection, TextSelection } from './variants/index.js';

interface SelectionConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): BaseSelection;

  type: string;
  fromJSON(json: Record<string, unknown>): BaseSelection;
}

export class SelectionManager {
  private _mutex = createMutex();
  private _selectionConstructors: Record<string, SelectionConstructor> = {};
  private _changedSlot = new Slot<BaseSelection[]>();
  private _oldSelections: BaseSelection[] = [];

  disposables = new DisposableGroup();
  readonly rangeController = new RangeController();

  constructor(public root: HTMLElement, public workspace: Workspace) {
    this._setupDefaultSelections();
  }

  register(ctor: SelectionConstructor | SelectionConstructor[]) {
    [ctor].flat().forEach(ctor => {
      this._selectionConstructors[ctor.type] = ctor;
    });
    return this;
  }

  private get _store() {
    return this.workspace.awarenessStore;
  }

  private _setupDefaultSelections() {
    this.register([TextSelection, BlockSelection]);
  }

  subscribe = (fn: (selections: BaseSelection[]) => void) =>
    this._changedSlot.on(selections => this._mutex(() => fn(selections)));

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

  get selections() {
    return this._store.getLocalSelection().map(json => {
      const ctor = this._selectionConstructors[json.type as string];
      if (!ctor) {
        throw new Error(`Unknown selection type: ${json.type}`);
      }
      return ctor.fromJSON(json);
    });
  }

  setSelections(selections: BaseSelection[], needSync = true) {
    const setter = (): void => {
      this._oldSelections = this.selections;
      this._store.setLocalSelection(selections.map(s => s.toJSON()));
      this._changedSlot.emit(selections);
    };
    if (needSync) {
      return setter();
    }
    this._mutex(setter);
  }

  get remoteSelections() {
    return Object.fromEntries(
      Array.from(this._store.getStates().entries())
        .filter(([key]) => key !== this._store.awareness.clientID)
        .map(([key, value]) => [key, value.selection] as const)
    );
  }

  mount(page: Page) {
    if (this.disposables.disposed) {
      this.disposables = new DisposableGroup();
    }
    this.rangeController.start();
    page.history.on('stack-item-added', (event: { stackItem: StackItem }) => {
      event.stackItem.meta.set('selection-state', this._oldSelections);
    });
    page.history.on('stack-item-popped', (event: { stackItem: StackItem }) => {
      const selection = event.stackItem.meta.get('selection-state');
      if (selection) {
        this.setSelections(selection as BaseSelection[]);
      }
    });
  }

  unmount() {
    this.rangeController.stop();
    this._changedSlot.dispose();
    this.disposables.dispose();
  }
}
