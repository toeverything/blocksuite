import type { InsertToPosition } from '@blocksuite/affine-shared/utils';

import { computed, type ReadonlySignal } from '@preact/signals-core';

import type { TypeInstance } from '../logical/type.js';
import type { PropertyMetaConfig } from '../property/property-config.js';
import type { DatabaseFlags } from '../types.js';
import type { ViewConvertConfig } from '../view/convert.js';
import type { DataViewDataType, ViewMeta } from '../view/data-view.js';
import type { ViewManager } from '../view-manager/view-manager.js';
import type { DataViewContextKey } from './context.js';

export interface DataSource {
  readonly$: ReadonlySignal<boolean>;
  properties$: ReadonlySignal<string[]>;
  featureFlags$: ReadonlySignal<DatabaseFlags>;

  cellValueGet(rowId: string, propertyId: string): unknown;
  cellValueGet$(
    rowId: string,
    propertyId: string
  ): ReadonlySignal<unknown | undefined>;
  cellValueChange(rowId: string, propertyId: string, value: unknown): void;

  rows$: ReadonlySignal<string[]>;
  rowAdd(InsertToPosition: InsertToPosition | number): string;
  rowDelete(ids: string[]): void;
  rowMove(rowId: string, position: InsertToPosition): void;

  propertyMetas: PropertyMetaConfig[];

  propertyNameGet$(propertyId: string): ReadonlySignal<string | undefined>;
  propertyNameGet(propertyId: string): string;
  propertyNameSet(propertyId: string, name: string): void;

  propertyTypeGet(propertyId: string): string | undefined;
  propertyTypeGet$(propertyId: string): ReadonlySignal<string | undefined>;
  propertyTypeSet(propertyId: string, type: string): void;

  propertyDataGet(propertyId: string): Record<string, unknown>;
  propertyDataGet$(
    propertyId: string
  ): ReadonlySignal<Record<string, unknown> | undefined>;
  propertyDataSet(propertyId: string, data: Record<string, unknown>): void;

  propertyDataTypeGet(propertyId: string): TypeInstance | undefined;
  propertyDataTypeGet$(
    propertyId: string
  ): ReadonlySignal<TypeInstance | undefined>;

  propertyReadonlyGet(propertyId: string): boolean;
  propertyReadonlyGet$(propertyId: string): ReadonlySignal<boolean>;

  propertyMetaGet(type: string): PropertyMetaConfig;
  propertyAdd(insertToPosition: InsertToPosition, type?: string): string;
  propertyDuplicate(propertyId: string): string;
  propertyDelete(id: string): void;

  contextGet<T>(key: DataViewContextKey<T>): T;

  viewConverts: ViewConvertConfig[];
  viewManager: ViewManager;
  viewMetas: ViewMeta[];
  viewDataList$: ReadonlySignal<DataViewDataType[]>;

  viewDataGet(viewId: string): DataViewDataType | undefined;
  viewDataGet$(viewId: string): ReadonlySignal<DataViewDataType | undefined>;

  viewDataAdd(viewData: DataViewDataType): string;
  viewDataDuplicate(id: string): string;
  viewDataDelete(viewId: string): void;
  viewDataMoveTo(id: string, position: InsertToPosition): void;
  viewDataUpdate<ViewData extends DataViewDataType>(
    id: string,
    updater: (data: ViewData) => Partial<ViewData>
  ): void;

  viewMetaGet(type: string): ViewMeta;
  viewMetaGet$(type: string): ReadonlySignal<ViewMeta | undefined>;

  viewMetaGetById(viewId: string): ViewMeta;
  viewMetaGetById$(viewId: string): ReadonlySignal<ViewMeta | undefined>;
}

export abstract class DataSourceBase implements DataSource {
  context = new Map<symbol, unknown>();

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

  cellValueGet$(
    rowId: string,
    propertyId: string
  ): ReadonlySignal<unknown | undefined> {
    return computed(() => this.cellValueGet(rowId, propertyId));
  }

  contextGet<T>(key: DataViewContextKey<T>): T {
    return (this.context.get(key.key) as T) ?? key.defaultValue;
  }

  contextSet<T>(key: DataViewContextKey<T>, value: T): void {
    this.context.set(key.key, value);
  }

  abstract propertyAdd(
    insertToPosition: InsertToPosition,
    type?: string
  ): string;

  abstract propertyDataGet(propertyId: string): Record<string, unknown>;

  propertyDataGet$(
    propertyId: string
  ): ReadonlySignal<Record<string, unknown> | undefined> {
    return computed(() => this.propertyDataGet(propertyId));
  }

  abstract propertyDataSet(
    propertyId: string,
    data: Record<string, unknown>
  ): void;

  abstract propertyDataTypeGet(propertyId: string): TypeInstance | undefined;

  propertyDataTypeGet$(
    propertyId: string
  ): ReadonlySignal<TypeInstance | undefined> {
    return computed(() => this.propertyDataTypeGet(propertyId));
  }

  abstract propertyDelete(id: string): void;

  abstract propertyDuplicate(propertyId: string): string;

  abstract propertyMetaGet(type: string): PropertyMetaConfig;

  abstract propertyNameGet(propertyId: string): string;

  propertyNameGet$(propertyId: string): ReadonlySignal<string | undefined> {
    return computed(() => this.propertyNameGet(propertyId));
  }

  abstract propertyNameSet(propertyId: string, name: string): void;

  propertyReadonlyGet(_propertyId: string): boolean {
    return false;
  }

  propertyReadonlyGet$(propertyId: string): ReadonlySignal<boolean> {
    return computed(() => this.propertyReadonlyGet(propertyId));
  }

  abstract propertyTypeGet(propertyId: string): string;

  propertyTypeGet$(propertyId: string): ReadonlySignal<string | undefined> {
    return computed(() => this.propertyTypeGet(propertyId));
  }

  abstract propertyTypeSet(propertyId: string, type: string): void;

  abstract rowAdd(InsertToPosition: InsertToPosition | number): string;

  abstract rowDelete(ids: string[]): void;

  abstract rowMove(rowId: string, position: InsertToPosition): void;

  abstract viewDataAdd(viewData: DataViewDataType): string;

  abstract viewDataDelete(viewId: string): void;

  abstract viewDataDuplicate(id: string): string;

  abstract viewDataGet(viewId: string): DataViewDataType;

  viewDataGet$(viewId: string): ReadonlySignal<DataViewDataType | undefined> {
    return computed(() => this.viewDataGet(viewId));
  }

  abstract viewDataMoveTo(id: string, position: InsertToPosition): void;

  abstract viewDataUpdate<ViewData extends DataViewDataType>(
    id: string,
    updater: (data: ViewData) => Partial<ViewData>
  ): void;

  abstract viewMetaGet(type: string): ViewMeta;

  viewMetaGet$(type: string): ReadonlySignal<ViewMeta | undefined> {
    return computed(() => this.viewMetaGet(type));
  }

  abstract viewMetaGetById(viewId: string): ViewMeta;

  viewMetaGetById$(viewId: string): ReadonlySignal<ViewMeta | undefined> {
    return computed(() => this.viewMetaGetById(viewId));
  }
}
