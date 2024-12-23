import type { InsertToPosition } from '@blocksuite/affine-shared/utils';

import { nanoid } from '@blocksuite/store';
import { computed, type ReadonlySignal, signal } from '@preact/signals-core';

import type { DataSource } from '../common/data-source/base.js';
import type {
  DataViewDataType,
  DataViewMode,
  ViewMeta,
} from '../view/data-view.js';
import type { SingleView } from './single-view.js';

export interface ViewManager {
  viewMetas: ViewMeta[];
  dataSource: DataSource;
  readonly$: ReadonlySignal<boolean>;

  currentViewId$: ReadonlySignal<string>;
  currentView$: ReadonlySignal<SingleView>;

  setCurrentView(id: string): void;

  views$: ReadonlySignal<string[]>;

  viewGet(id: string): SingleView;

  viewAdd(type: DataViewMode): string;

  viewDelete(id: string): void;

  viewDuplicate(id: string): void;

  viewDataGet(id: string): DataViewDataType | undefined;

  moveTo(id: string, position: InsertToPosition): void;
}

export class ViewManagerBase implements ViewManager {
  _currentViewId$ = signal<string | undefined>(undefined);

  views$ = computed(() => {
    return this.dataSource.viewDataList$.value.map(data => data.id);
  });

  currentViewId$ = computed(() => {
    return this._currentViewId$.value ?? this.views$.value[0];
  });

  currentView$ = computed(() => {
    return this.viewGet(this.currentViewId$.value);
  });

  readonly$ = computed(() => {
    return this.dataSource.readonly$.value;
  });

  get viewMetas() {
    return this.dataSource.viewMetas;
  }

  constructor(public dataSource: DataSource) {}

  moveTo(id: string, position: InsertToPosition): void {
    this.dataSource.viewDataMoveTo(id, position);
  }

  setCurrentView(id: string): void {
    this._currentViewId$.value = id;
  }

  viewAdd(type: DataViewMode): string {
    const meta = this.dataSource.viewMetaGet(type);
    const data = meta.model.defaultData(this);
    const id = this.dataSource.viewDataAdd({
      ...data,
      id: nanoid(),
      name: meta.model.defaultName,
      mode: type,
    });
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
