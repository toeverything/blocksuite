import type { Disposable, Slot } from '@blocksuite/global/utils';

import type { ColumnMeta } from '../../column/column-config.js';
import type { ColumnConfig } from '../../column/index.js';
import type { InsertToPosition } from '../../types.js';
import type { UniComponent } from '../../utils/uni-component/index.js';
import type { DataViewManager } from '../../view/data-view-manager.js';
import { DEFAULT_COLUMN_WIDTH } from '../../view/presets/table/consts.js';
import type { DataViewContextKey } from './context.js';

export type DetailSlotProps = {
  view: DataViewManager;
  rowId: string;
};

export interface DetailSlots {
  header?: UniComponent<DetailSlotProps>;
  note?: UniComponent<DetailSlotProps>;
}

export interface DataSource {
  addPropertyConfigList: ColumnConfig[];

  properties: string[];
  rows: string[];
  cellGetValue: (rowId: string, propertyId: string) => unknown;
  cellGetRenderValue: (rowId: string, propertyId: string) => unknown;
  cellGetExtra: (rowId: string, columnId: string) => unknown;
  cellChangeRenderValue: (
    rowId: string,
    propertyId: string,
    value: unknown
  ) => unknown;
  cellChangeValue: (rowId: string, propertyId: string, value: unknown) => void;
  rowAdd: (InsertToPosition: InsertToPosition | number) => string;
  rowDelete: (ids: string[]) => void;
  propertyGetName: (propertyId: string) => string;
  propertyGetDefaultWidth: (propertyId: string) => number;
  propertyGetType: (propertyId: string) => string;
  propertyGetData: (propertyId: string) => Record<string, unknown>;
  propertyGetReadonly: (columnId: string) => boolean;
  propertyChangeName: (propertyId: string, name: string) => void;
  propertyChangeType: (propertyId: string, type: string) => void;
  propertyChangeData: (
    propertyId: string,
    data: Record<string, unknown>
  ) => void;
  propertyAdd: (insertToPosition: InsertToPosition, type?: string) => string;
  propertyDelete: (id: string) => void;
  propertyDuplicate: (columnId: string) => string;

  slots: {
    update: Slot;
  };

  onCellUpdate: (
    rowId: string,
    propertyId: string,
    callback: () => void
  ) => Disposable;

  detailSlots: DetailSlots;

  getPropertyMeta(type: string): ColumnMeta;

  rowMove(rowId: string, position: InsertToPosition): void;

  getContext<T>(key: DataViewContextKey<T>): T | undefined;
}

export abstract class BaseDataSource implements DataSource {
  get detailSlots(): DetailSlots {
    return {};
  }

  context = new Map<DataViewContextKey<unknown>, unknown>();

  abstract properties: string[];

  abstract rows: string[];

  abstract slots: {
    update: Slot;
  };

  abstract addPropertyConfigList: ColumnConfig[];

  protected setContext<T>(key: DataViewContextKey<T>, value: T): void {
    this.context.set(key, value);
  }

  getContext<T>(key: DataViewContextKey<T>): T | undefined {
    return this.context.get(key) as T;
  }

  abstract cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void;

  cellChangeRenderValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    this.cellChangeValue(rowId, propertyId, value);
  }

  cellGetRenderValue(rowId: string, propertyId: string): unknown {
    return this.cellGetValue(rowId, propertyId);
  }

  cellGetExtra(_rowId: string, _propertyId: string): unknown {
    return undefined;
  }

  abstract cellGetValue(rowId: string, propertyId: string): unknown;

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

  propertyGetReadonly(_propertyId: string): boolean {
    return false;
  }

  propertyGetDefaultWidth(_propertyId: string): number {
    return DEFAULT_COLUMN_WIDTH;
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

  abstract propertyGetName(propertyId: string): string;

  abstract propertyGetType(propertyId: string): string;

  abstract rowAdd(InsertToPosition: InsertToPosition | number): string;

  abstract rowDelete(ids: string[]): void;

  abstract getPropertyMeta(type: string): ColumnMeta;

  abstract rowMove(rowId: string, position: InsertToPosition): void;
}
