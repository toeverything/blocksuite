import type { Workspace } from '@blocksuite/store';
import { DisposableGroup, Slot } from '@blocksuite/store';

import type { BaseSelection } from './base.js';

interface SelectionConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): BaseSelection;

  type: string;
  fromJSON(json: Record<string, unknown>): BaseSelection;
}

export class SelectionManager {
  private _workspace: Workspace;

  disposables = new DisposableGroup();
  _selectionConstructors: Record<string, SelectionConstructor> = {};

  slots = {
    changed: new Slot<BaseSelection[]>(),
  };

  constructor(workspace: Workspace) {
    this._workspace = workspace;
  }

  register(ctor: SelectionConstructor) {
    this._selectionConstructors[ctor.type] = ctor;
  }

  private get _store() {
    return this._workspace.awarenessStore;
  }

  getInstance<T extends BlockSuiteSelectionType>(
    type: T,
    ...args: ConstructorParameters<BlockSuiteSelection[T]>
  ) {
    const ctor = this._selectionConstructors[type];
    if (!ctor) {
      throw new Error(`Unknown selection type: ${type}`);
    }
    return new ctor(...args);
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

  setSelections(selections: BaseSelection[]) {
    this._store.setLocalSelection(selections.map(s => s.toJSON()));
    this.slots.changed.emit(selections);
  }

  get remoteSelections() {
    return Object.fromEntries(
      Array.from(this._store.getStates().entries())
        .filter(([key]) => key !== this._store.awareness.clientID)
        .map(([key, value]) => [key, value.selection] as const)
    );
  }

  dispose() {
    Object.values(this.slots).forEach(slot => slot.dispose());
    this.disposables.dispose();
  }
}
