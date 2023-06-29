import type { Workspace } from '@blocksuite/store';
import { DisposableGroup, Slot } from '@blocksuite/store';

import type { BaseSelection } from './base.js';

interface SelectionConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): BaseSelection;

  type: BlockSuiteSelectionType;
  fromJSON(json: Record<string, unknown>): BaseSelection;
}

export class SelectionManager {
  private _workspace: Workspace;

  disposables = new DisposableGroup();
  selectionConstructors: Record<string, SelectionConstructor> = {};

  slots = {
    changed: new Slot<BaseSelection[]>(),
  };

  constructor(workspace: Workspace) {
    this._workspace = workspace;
  }

  register(type: BlockSuiteSelectionType, ctor: SelectionConstructor) {
    this.selectionConstructors[type] = ctor;
  }

  private get _store() {
    return this._workspace.awarenessStore;
  }

  get selections() {
    return this._store.getLocalSelection().map(json => {
      const ctor = this.selectionConstructors[json.type as string];
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
    return this._store.getStates();
  }

  dispose() {
    Object.values(this.slots).forEach(slot => slot.dispose());
    this.disposables.dispose();
  }
}
