import type { InsertToPosition } from '@blocksuite/affine-shared/utils';

import {
  computed,
  type ReadonlySignal,
  signal,
} from '@lit-labs/preact-signals';

import type { DataSource } from '../common/data-source/base.js';
import type { DataViewDataType, DataViewTypes } from '../view/data-view.js';
import type { SingleView } from './single-view.js';

export interface ViewManager {
  dataSource: DataSource;
  readonly$: ReadonlySignal<boolean>;

  currentViewId$: ReadonlySignal<string>;
  currentView$: ReadonlySignal<SingleView>;
  setCurrentView(id: string): void;
  views$: ReadonlySignal<string[]>;

  viewGet(id: string): SingleView;
  viewAdd(type: DataViewTypes): string;
  viewDelete(id: string): void;
  viewDuplicate(id: string): void;

  viewDataGet(id: string): DataViewDataType | undefined;

  moveTo(id: string, position: InsertToPosition): void;
}

export class ViewManagerBase implements ViewManager {
  _currentViewId$ = signal<string | undefined>(undefined);

  currentView$ = computed(() => {
    return this.viewGet(this.currentViewId$.value);
  });

  currentViewId$ = computed(() => {
    return this._currentViewId$.value ?? this.views$.value[0];
  });

  readonly$ = computed(() => {
    return this.dataSource.readonly$.value;
  });

  views$ = computed(() => {
    return this.dataSource.viewDataList$.value.map(data => data.id);
  });

  constructor(public dataSource: DataSource) {}

  moveTo(id: string, position: InsertToPosition): void {
    this.dataSource.viewDataMoveTo(id, position);
  }

  setCurrentView(id: string): void {
    this._currentViewId$.value = id;
  }

  viewAdd(type: DataViewTypes): string {
    const id = this.dataSource.viewDataAdd(type);
    this.setCurrentView(id);
    return id;
  }

  viewDataGet(id: string): DataViewDataType | undefined {
    return this.dataSource.viewDataGet(id);
  }

  viewDelete(id: string): void {
    this.dataSource.viewDataDelete(id);
    this.setCurrentView(this.views$.value[0]);
  }

  viewDuplicate(id: string): void {
    const newId = this.dataSource.viewDataDuplicate(id);
    this.setCurrentView(newId);
  }

  viewGet(id: string): SingleView {
    const meta = this.dataSource.viewMetaGetById(id);
    return new meta.model.dataViewManager(this, id);
  }
}
