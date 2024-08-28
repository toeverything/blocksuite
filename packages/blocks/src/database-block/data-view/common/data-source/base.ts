import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import type { ReadonlySignal } from '@lit-labs/preact-signals';

import type { ColumnConfig, ColumnMeta } from '../../column/column-config.js';
import type { DatabaseFlags } from '../../types.js';
import type { UniComponent } from '../../utils/uni-component/index.js';
import type {
  DataViewDataType,
  DataViewTypes,
  ViewMeta,
} from '../../view/data-view.js';
import type { SingleView } from '../../view-manager/single-view.js';
import type { ViewManager } from '../../view-manager/view-manager.js';
import type { DataViewContextKey } from './context.js';

import { DEFAULT_COLUMN_WIDTH } from '../../view/presets/table/consts.js';

export type DetailSlotProps = {
  view: SingleView;
  rowId: string;
};

export interface DetailSlots {
  header?: UniComponent<DetailSlotProps>;
  note?: UniComponent<DetailSlotProps>;
}

export interface DataSource {
  readonly$: ReadonlySignal<boolean>;
  addPropertyConfigList: ColumnConfig[];

  properties$: ReadonlySignal<string[]>;
  rows$: ReadonlySignal<string[]>;

  cellGetValue(rowId: string, propertyId: string): unknown;
  cellChangeValue(rowId: string, propertyId: string, value: unknown): void;
  rowAdd(InsertToPosition: InsertToPosition | number): string;
  rowDelete(ids: string[]): void;
  propertyGetName(propertyId: string): string;
  propertyGetDefaultWidth(propertyId: string): number;
  propertyGetType(propertyId: string): string | undefined;
  propertyGetData(propertyId: string): Record<string, unknown>;
  propertyGetReadonly(columnId: string): boolean;
  propertyChangeName(propertyId: string, name: string): void;
  propertyChangeType(propertyId: string, type: string): void;
  propertyChangeData(propertyId: string, data: Record<string, unknown>): void;
  propertyAdd(insertToPosition: InsertToPosition, type?: string): string;
  propertyDelete(id: string): void;
  propertyDuplicate(columnId: string): string;

  featureFlags$: ReadonlySignal<DatabaseFlags>;
  detailSlots: DetailSlots;

  getPropertyMeta(type: string): ColumnMeta;

  rowMove(rowId: string, position: InsertToPosition): void;

  getContext<T>(key: DataViewContextKey<T>): T | undefined;

  viewManager: ViewManager;

  viewDataList$: ReadonlySignal<DataViewDataType[]>;
  viewDataAdd(viewType: DataViewTypes): string;
  viewDataDuplicate(id: string): string;
  viewDataDelete(viewId: string): void;
  viewDataGet(viewId: string): DataViewDataType | undefined;
  viewDataMoveTo(id: string, position: InsertToPosition): void;
  viewDataUpdate<ViewData extends DataViewDataType>(
    id: string,
    updater: (data: ViewData) => Partial<ViewData>
  ): void;

  viewMetas: ViewMeta[];
  viewMetaGet(type: string): ViewMeta;
  viewMetaGetById(viewId: string): ViewMeta;
}

export abstract class DataSourceBase implements DataSource {
  context = new Map<DataViewContextKey<unknown>, unknown>();

  getContext<T>(key: DataViewContextKey<T>): T | undefined {
    return this.context.get(key) as T;
  }

  propertyGetDefaultWidth(_propertyId: string): number {
    return DEFAULT_COLUMN_WIDTH;
  }

  propertyGetReadonly(_propertyId: string): boolean {
    return false;
  }

  protected setContext<T>(key: DataViewContextKey<T>, value: T): void {
    this.context.set(key, value);
  }

  get detailSlots(): DetailSlots {
    return {};
  }

  abstract addPropertyConfigList: ColumnConfig[];

  abstract cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void;

  abstract cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void;

  abstract cellGetValue(rowId: string, propertyId: string): unknown;

  abstract featureFlags$: ReadonlySignal<DatabaseFlags>;

  abstract getPropertyMeta(type: string): ColumnMeta;

  abstract properties$: ReadonlySignal<string[]>;

  abstract propertyAdd(
    insertToPosition: InsertToPosition,
    type?: string
  ): string;

  abstract propertyChangeData(
    propertyId: string,
    data: Record<string, unknown>
  ): void;

  abstract propertyChangeName(propertyId: string, name: string): void;

  abstract propertyChangeType(propertyId: string, type: string): void;

  abstract propertyDelete(id: string): void;

  abstract propertyDuplicate(columnId: string): string;

  abstract propertyGetData(propertyId: string): Record<string, unknown>;

  abstract propertyGetName(propertyId: string): string;

  abstract propertyGetType(propertyId: string): string;

  abstract readonly$: ReadonlySignal<boolean>;

  abstract rowAdd(InsertToPosition: InsertToPosition | number): string;

  abstract rowDelete(ids: string[]): void;

  abstract rowMove(rowId: string, position: InsertToPosition): void;
  abstract rows$: ReadonlySignal<string[]>;

  abstract viewDataAdd(viewType: DataViewTypes): string;

  abstract viewDataDelete(viewId: string): void;

  abstract viewDataDuplicate(id: string): string;

  abstract viewDataGet(viewId: string): DataViewDataType;

  abstract viewDataList$: ReadonlySignal<DataViewDataType[]>;

  abstract viewDataMoveTo(id: string, position: InsertToPosition): void;

  abstract viewDataUpdate<ViewData extends DataViewDataType>(
    id: string,
    updater: (data: ViewData) => Partial<ViewData>
  ): void;

  abstract viewManager: ViewManager;
  abstract viewMetaGet(type: string): ViewMeta;
  abstract viewMetaGetById(viewId: string): ViewMeta;

  abstract viewMetas: ViewMeta[];
}
