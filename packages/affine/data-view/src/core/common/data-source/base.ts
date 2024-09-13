import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import type { ReadonlySignal } from '@preact/signals-core';

import type { ColumnMeta } from '../../column/column-config.js';
import type { TType } from '../../logical/index.js';
import type { DatabaseFlags } from '../../types.js';
import type { UniComponent } from '../../utils/uni-component/index.js';
import type { ViewConvertConfig } from '../../view/convert.js';
import type { DataViewDataType, ViewMeta } from '../../view/data-view.js';
import type { SingleView } from '../../view-manager/single-view.js';
import type { ViewManager } from '../../view-manager/view-manager.js';
import type { DataViewContextKey } from './context.js';

import { DEFAULT_COLUMN_WIDTH } from '../../../view-presets/table/consts.js';

export type DetailSlotProps = {
  view: SingleView;
  rowId: string;
};

export interface DetailSlots {
  header?: UniComponent<DetailSlotProps>;
  note?: UniComponent<DetailSlotProps>;
}

export interface DataSource {
  viewConverts: ViewConvertConfig[];
  readonly$: ReadonlySignal<boolean>;
  addPropertyConfigList: ColumnMeta[];

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

  propertyGetDataType(propertyId: string): TType | undefined;

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

  viewDataAdd(viewData: DataViewDataType): string;

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
  abstract addPropertyConfigList: ColumnMeta[];

  context = new Map<DataViewContextKey<unknown>, unknown>();

  abstract featureFlags$: ReadonlySignal<DatabaseFlags>;

  abstract properties$: ReadonlySignal<string[]>;

  abstract readonly$: ReadonlySignal<boolean>;

  abstract rows$: ReadonlySignal<string[]>;

  abstract viewConverts: ViewConvertConfig[];

  abstract viewDataList$: ReadonlySignal<DataViewDataType[]>;

  abstract viewManager: ViewManager;

  abstract viewMetas: ViewMeta[];

  get detailSlots(): DetailSlots {
    return {};
  }

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

  getContext<T>(key: DataViewContextKey<T>): T | undefined {
    return this.context.get(key) as T;
  }

  abstract getPropertyMeta(type: string): ColumnMeta;

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

  abstract propertyGetDataType(propertyId: string): TType | undefined;

  propertyGetDefaultWidth(_propertyId: string): number {
    return DEFAULT_COLUMN_WIDTH;
  }

  abstract propertyGetName(propertyId: string): string;

  propertyGetReadonly(_propertyId: string): boolean {
    return false;
  }

  abstract propertyGetType(propertyId: string): string;

  abstract rowAdd(InsertToPosition: InsertToPosition | number): string;

  abstract rowDelete(ids: string[]): void;

  abstract rowMove(rowId: string, position: InsertToPosition): void;

  protected setContext<T>(key: DataViewContextKey<T>, value: T): void {
    this.context.set(key, value);
  }

  abstract viewDataAdd(viewData: DataViewDataType): string;

  abstract viewDataDelete(viewId: string): void;

  abstract viewDataDuplicate(id: string): string;

  abstract viewDataGet(viewId: string): DataViewDataType;

  abstract viewDataMoveTo(id: string, position: InsertToPosition): void;

  abstract viewDataUpdate<ViewData extends DataViewDataType>(
    id: string,
    updater: (data: ViewData) => Partial<ViewData>
  ): void;

  abstract viewMetaGet(type: string): ViewMeta;

  abstract viewMetaGetById(viewId: string): ViewMeta;
}
