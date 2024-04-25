import type { Disposable, Slot } from '@blocksuite/global/utils';

import type { ColumnMeta } from '../../column/column-config.js';
import type { ColumnConfig } from '../../column/index.js';
import type { InsertToPosition } from '../../types.js';
import type { UniComponent } from '../../utils/uni-component/index.js';
import type { DataViewManager } from '../../view/data-view-manager.js';
import { DEFAULT_COLUMN_WIDTH } from '../../view/presets/table/consts.js';

export type DetailSlotProps = { view: DataViewManager; rowId: string };

export interface DetailSlots {
  header?: UniComponent<DetailSlotProps>;
}

export interface DataSource {
  addPropertyConfigList: ColumnConfig[];
  getPropertyMeta(type: string): ColumnMeta;
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

  rowMove(rowId: string, position: InsertToPosition): void;
}

export abstract class BaseDataSource implements DataSource {
  public abstract cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void;

  public cellChangeRenderValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    this.cellChangeValue(rowId, propertyId, value);
  }

  public cellGetRenderValue(rowId: string, propertyId: string): unknown {
    return this.cellGetValue(rowId, propertyId);
  }

  public cellGetExtra(_rowId: string, _propertyId: string): unknown {
    return undefined;
  }

  public abstract cellGetValue(rowId: string, propertyId: string): unknown;

  public abstract properties: string[];

  public abstract propertyAdd(
    insertToPosition: InsertToPosition,
    type?: string
  ): string;

  public abstract propertyChangeData(
    propertyId: string,
    data: Record<string, unknown>
  ): void;

  public abstract propertyChangeName(propertyId: string, name: string): void;

  public abstract propertyChangeType(propertyId: string, type: string): void;

  public abstract propertyDelete(id: string): void;

  public abstract propertyDuplicate(columnId: string): string;

  public abstract propertyGetData(propertyId: string): Record<string, unknown>;

  public propertyGetReadonly(_propertyId: string): boolean {
    return false;
  }

  public propertyGetDefaultWidth(_propertyId: string): number {
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

  public abstract propertyGetName(propertyId: string): string;

  public abstract propertyGetType(propertyId: string): string;

  public abstract rowAdd(InsertToPosition: InsertToPosition | number): string;

  public abstract rowDelete(ids: string[]): void;

  public abstract rows: string[];

  public abstract slots: {
    update: Slot;
  };

  public abstract addPropertyConfigList: ColumnConfig[];
  public abstract getPropertyMeta(type: string): ColumnMeta;
  public get detailSlots(): DetailSlots {
    return {};
  }

  public abstract rowMove(rowId: string, position: InsertToPosition): void;
}
