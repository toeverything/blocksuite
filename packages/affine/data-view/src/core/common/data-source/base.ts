import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import type { ReadonlySignal } from '@preact/signals-core';

import type { TType } from '../../logical/index.js';
import type { PropertyMetaConfig } from '../../property/property-config.js';
import type { DatabaseFlags } from '../../types.js';
import type { ViewConvertConfig } from '../../view/convert.js';
import type { DataViewDataType, ViewMeta } from '../../view/data-view.js';
import type { ViewManager } from '../../view-manager/view-manager.js';
import type { DataViewContextKey } from './context.js';

export interface DataSource {
  readonly$: ReadonlySignal<boolean>;
  properties$: ReadonlySignal<string[]>;
  featureFlags$: ReadonlySignal<DatabaseFlags>;

  cellValueGet(rowId: string, propertyId: string): unknown;
  cellValueChange(rowId: string, propertyId: string, value: unknown): void;

  rows$: ReadonlySignal<string[]>;
  rowAdd(InsertToPosition: InsertToPosition | number): string;
  rowDelete(ids: string[]): void;
  rowMove(rowId: string, position: InsertToPosition): void;

  propertyMetas: PropertyMetaConfig[];

  propertyNameGet(propertyId: string): string;
  propertyNameSet(propertyId: string, name: string): void;

  propertyTypeGet(propertyId: string): string | undefined;
  propertyTypeSet(propertyId: string, type: string): void;

  propertyDataGet(propertyId: string): Record<string, unknown>;
  propertyDataSet(propertyId: string, data: Record<string, unknown>): void;

  propertyDataTypeGet(propertyId: string): TType | undefined;
  propertyReadonlyGet(propertyId: string): boolean;
  propertyMetaGet(type: string): PropertyMetaConfig;
  propertyAdd(insertToPosition: InsertToPosition, type?: string): string;
  propertyDuplicate(propertyId: string): string;
  propertyDelete(id: string): void;

  contextGet<T>(key: DataViewContextKey<T>): T | undefined;

  viewConverts: ViewConvertConfig[];
  viewManager: ViewManager;
  viewMetas: ViewMeta[];
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
  viewMetaGet(type: string): ViewMeta;
  viewMetaGetById(viewId: string): ViewMeta;
}

export abstract class DataSourceBase implements DataSource {
  context = new Map<DataViewContextKey<unknown>, unknown>();

  abstract featureFlags$: ReadonlySignal<DatabaseFlags>;

  abstract properties$: ReadonlySignal<string[]>;

  abstract propertyMetas: PropertyMetaConfig[];

  abstract readonly$: ReadonlySignal<boolean>;

  abstract rows$: ReadonlySignal<string[]>;

  abstract viewConverts: ViewConvertConfig[];

  abstract viewDataList$: ReadonlySignal<DataViewDataType[]>;

  abstract viewManager: ViewManager;

  abstract viewMetas: ViewMeta[];

  abstract cellValueChange(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void;

  abstract cellValueChange(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void;

  abstract cellValueGet(rowId: string, propertyId: string): unknown;

  contextGet<T>(key: DataViewContextKey<T>): T | undefined {
    return this.context.get(key) as T;
  }

  contextSet<T>(key: DataViewContextKey<T>, value: T): void {
    this.context.set(key, value);
  }

  abstract propertyAdd(
    insertToPosition: InsertToPosition,
    type?: string
  ): string;

  abstract propertyDataGet(propertyId: string): Record<string, unknown>;

  abstract propertyDataSet(
    propertyId: string,
    data: Record<string, unknown>
  ): void;

  abstract propertyDataTypeGet(propertyId: string): TType | undefined;

  abstract propertyDelete(id: string): void;

  abstract propertyDuplicate(propertyId: string): string;

  abstract propertyMetaGet(type: string): PropertyMetaConfig;

  abstract propertyNameGet(propertyId: string): string;

  abstract propertyNameSet(propertyId: string, name: string): void;

  propertyReadonlyGet(_propertyId: string): boolean {
    return false;
  }

  abstract propertyTypeGet(propertyId: string): string;

  abstract propertyTypeSet(propertyId: string, type: string): void;

  abstract rowAdd(InsertToPosition: InsertToPosition | number): string;

  abstract rowDelete(ids: string[]): void;

  abstract rowMove(rowId: string, position: InsertToPosition): void;

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
