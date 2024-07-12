import type { Disposable, Slot } from '@blocksuite/global/utils';

import type { ColumnMeta } from '../../column/column-config.js';
import type { ColumnConfig } from '../../column/index.js';
import type { InsertToPosition } from '../../types.js';
import type { UniComponent } from '../../utils/uni-component/index.js';
import type { DataViewManager } from '../../view/data-view-manager.js';
import type { DataViewContextKey } from './context.js';

import { DEFAULT_COLUMN_WIDTH } from '../../view/presets/table/consts.js';

export type DetailSlotProps = {
  rowId: string;
  view: DataViewManager;
};

export interface DetailSlots {
  header?: UniComponent<DetailSlotProps>;
  note?: UniComponent<DetailSlotProps>;
}

export interface DataSource {
  addPropertyConfigList: ColumnConfig[];

  cellChangeRenderValue: (
    rowId: string,
    propertyId: string,
    value: unknown
  ) => unknown;
  cellChangeValue: (rowId: string, propertyId: string, value: unknown) => void;
  cellGetExtra: (rowId: string, columnId: string) => unknown;
  cellGetRenderValue: (rowId: string, propertyId: string) => unknown;
  cellGetValue: (rowId: string, propertyId: string) => unknown;
  detailSlots: DetailSlots;
  getContext<T>(key: DataViewContextKey<T>): T | undefined;
  getPropertyMeta(type: string): ColumnMeta;
  onCellUpdate: (
    rowId: string,
    propertyId: string,
    callback: () => void
  ) => Disposable;
  properties: string[];
  propertyAdd: (insertToPosition: InsertToPosition, type?: string) => string;
  propertyChangeData: (
    propertyId: string,
    data: Record<string, unknown>
  ) => void;
  propertyChangeName: (propertyId: string, name: string) => void;
  propertyChangeType: (propertyId: string, type: string) => void;
  propertyDelete: (id: string) => void;
  propertyDuplicate: (columnId: string) => string;
  propertyGetData: (propertyId: string) => Record<string, unknown>;
  propertyGetDefaultWidth: (propertyId: string) => number;
  propertyGetName: (propertyId: string) => string;
  propertyGetReadonly: (columnId: string) => boolean;

  propertyGetType: (propertyId: string) => string;

  rowAdd: (InsertToPosition: InsertToPosition | number) => string;

  rowDelete: (ids: string[]) => void;

  rowMove(rowId: string, position: InsertToPosition): void;

  rows: string[];

  slots: {
    update: Slot;
  };
}

export abstract class BaseDataSource implements DataSource {
  context = new Map<DataViewContextKey<unknown>, unknown>();

  cellChangeRenderValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    this.cellChangeValue(rowId, propertyId, value);
  }

  cellGetExtra(_rowId: string, _propertyId: string): unknown {
    return undefined;
  }

  cellGetRenderValue(rowId: string, propertyId: string): unknown {
    return this.cellGetValue(rowId, propertyId);
  }

  getContext<T>(key: DataViewContextKey<T>): T | undefined {
    return this.context.get(key) as T;
  }

  onCellUpdate(
    _rowId: string,
    _propertyId: string,
    _callback: () => void
  ): Disposable {
    return {
      dispose: () => {
        //
      },
    };
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

  abstract cellGetValue(rowId: string, propertyId: string): unknown;

  abstract getPropertyMeta(type: string): ColumnMeta;

  abstract properties: string[];

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

  abstract rowAdd(InsertToPosition: InsertToPosition | number): string;

  abstract rowDelete(ids: string[]): void;

  abstract rowMove(rowId: string, position: InsertToPosition): void;

  abstract rows: string[];

  abstract slots: {
    update: Slot;
  };
}
