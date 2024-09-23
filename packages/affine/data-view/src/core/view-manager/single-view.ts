import type { InsertToPosition } from '@blocksuite/affine-shared/utils';

import { computed, type ReadonlySignal, signal } from '@preact/signals-core';

import type { FilterGroup, Variable } from '../common/ast.js';
import type { DataViewContextKey } from '../common/data-source/context.js';
import type { TType } from '../logical/typesystem.js';
import type { PropertyMetaConfig } from '../property/property-config.js';
import type { DatabaseFlags } from '../types.js';
import type { UniComponent } from '../utils/uni-component/index.js';
import type { DataViewDataType, ViewMeta } from '../view/data-view.js';
import type { Property } from './property.js';
import type { ViewManager } from './view-manager.js';

import { type Cell, CellBase } from './cell.js';
import { type Row, RowBase } from './row.js';

export type MainProperties = {
  titleColumn?: string;
  iconColumn?: string;
  imageColumn?: string;
};

export interface SingleView<
  ViewData extends DataViewDataType = DataViewDataType,
> {
  readonly id: string;
  readonly type: string;
  readonly manager: ViewManager;
  readonly meta: ViewMeta;
  readonly readonly$: ReadonlySignal<boolean>;
  delete(): void;
  duplicate(): void;

  data$: ReadonlySignal<ViewData | undefined>;
  dataUpdate(updater: (viewData: ViewData) => Partial<ViewData>): void;

  readonly name$: ReadonlySignal<string>;
  nameSet(name: string): void;

  readonly propertyIds$: ReadonlySignal<string[]>;
  readonly propertiesWithoutFilter$: ReadonlySignal<string[]>;
  readonly properties$: ReadonlySignal<Property[]>;
  readonly detailProperties$: ReadonlySignal<string[]>;
  readonly rows$: ReadonlySignal<string[]>;

  readonly filterVisible$: ReadonlySignal<boolean>;
  readonly filter$: ReadonlySignal<FilterGroup>;
  filterSet(filter: FilterGroup): void;

  readonly vars$: ReadonlySignal<Variable[]>;

  readonly featureFlags$: ReadonlySignal<DatabaseFlags>;

  cellValueGet(rowId: string, propertyId: string): unknown;
  cellValueSet(rowId: string, propertyId: string, value: unknown): void;

  cellJsonValueGet(rowId: string, propertyId: string): unknown;
  cellStringValueGet(rowId: string, propertyId: string): string | undefined;
  cellRenderValueSet(rowId: string, propertyId: string, value: unknown): void;
  cellGet(rowId: string, propertyId: string): Cell;

  propertyParseValueFromString(
    propertyId: string,
    value: string
  ):
    | {
        value: unknown;
        data?: Record<string, unknown>;
      }
    | undefined;

  rowAdd(insertPosition: InsertToPosition): string;
  rowDelete(ids: string[]): void;
  rowMove(rowId: string, position: InsertToPosition): void;
  rowGet(rowId: string): Row;

  rowPrevGet(rowId: string): string;
  rowNextGet(rowId: string): string;

  readonly propertyMetas: PropertyMetaConfig[];
  propertyAdd(toAfterOfProperty: InsertToPosition, type?: string): string;
  propertyDelete(propertyId: string): void;
  propertyDuplicate(propertyId: string): void;
  propertyGet(propertyId: string): Property;
  propertyMetaGet(type: string): PropertyMetaConfig | undefined;

  propertyPreGet(propertyId: string): Property | undefined;
  propertyNextGet(propertyId: string): Property | undefined;

  propertyNameGet(propertyId: string): string;
  propertyNameSet(propertyId: string, name: string): void;

  propertyTypeGet(propertyId: string): string | undefined;
  propertyTypeSet(propertyId: string, type: string): void;

  propertyHideGet(propertyId: string): boolean;
  propertyHideSet(propertyId: string, hide: boolean): void;

  propertyDataGet(propertyId: string): Record<string, unknown>;
  propertyDataSet(propertyId: string, data: Record<string, unknown>): void;

  propertyDataTypeGet(propertyId: string): TType | undefined;
  propertyIndexGet(propertyId: string): number;
  propertyIdGetByIndex(index: number): string;
  propertyReadonlyGet(propertyId: string): boolean;
  propertyMove(propertyId: string, position: InsertToPosition): void;

  IconGet(type: string): UniComponent | undefined;

  contextGet<T>(key: DataViewContextKey<T>): T | undefined;

  mainProperties$: ReadonlySignal<MainProperties>;
}

export abstract class SingleViewBase<
  ViewData extends DataViewDataType = DataViewDataType,
> implements SingleView<ViewData>
{
  private searchString = signal('');

  data$ = computed(() => {
    return this.dataSource.viewDataGet(this.id) as ViewData | undefined;
  });

  abstract detailProperties$: ReadonlySignal<string[]>;

  abstract filter$: ReadonlySignal<FilterGroup>;

  filterVisible$ = computed(() => {
    return (this.filter$.value?.conditions.length ?? 0) > 0;
  });

  abstract mainProperties$: ReadonlySignal<MainProperties>;

  name$: ReadonlySignal<string> = computed(() => {
    return this.data$.value?.name ?? '';
  });

  properties$ = computed(() => {
    return this.propertyIds$.value.map(
      id => this.propertyGet(id) as ReturnType<this['propertyGet']>
    );
  });

  abstract propertiesWithoutFilter$: ReadonlySignal<string[]>;

  abstract propertyIds$: ReadonlySignal<string[]>;

  abstract readonly$: ReadonlySignal<boolean>;

  rows$ = computed(() => {
    return this.filteredRows(this.searchString.value);
  });

  vars$ = computed(() => {
    return this.propertiesWithoutFilter$.value.map(id => {
      const v = this.propertyGet(id);
      const propertyMeta = this.dataSource.propertyMetaGet(v.type$.value);
      return {
        id: v.id,
        name: v.name$.value,
        type: propertyMeta.config.type(v.data$.value),
        icon: v.icon,
      };
    });
  });

  protected get dataSource() {
    return this.manager.dataSource;
  }

  get featureFlags$() {
    return this.dataSource.featureFlags$;
  }

  get meta() {
    return this.dataSource.viewMetaGet(this.type);
  }

  get propertyMetas(): PropertyMetaConfig[] {
    return this.dataSource.propertyMetas;
  }

  abstract get type(): string;

  constructor(
    public manager: ViewManager,
    public id: string
  ) {}

  private filteredRows(searchString: string): string[] {
    return this.dataSource.rows$.value.filter(id => {
      if (searchString) {
        const containsSearchString = this.propertyIds$.value.some(
          propertyId => {
            return this.cellStringValueGet(id, propertyId)
              ?.toLowerCase()
              .includes(searchString?.toLowerCase());
          }
        );
        if (!containsSearchString) {
          return false;
        }
      }
      return this.isShow(id);
    });
  }

  cellGet(rowId: string, propertyId: string): Cell {
    return new CellBase(this, propertyId, rowId);
  }

  cellJsonValueGet(rowId: string, propertyId: string): unknown {
    const type = this.propertyTypeGet(propertyId);
    if (!type) {
      return;
    }
    return this.dataSource
      .propertyMetaGet(type)
      .config.cellToJson(
        this.dataSource.cellValueGet(rowId, propertyId),
        this.propertyDataGet(propertyId)
      );
  }

  cellRenderValueSet(rowId: string, propertyId: string, value: unknown): void {
    this.dataSource.cellValueChange(rowId, propertyId, value);
  }

  cellStringValueGet(rowId: string, propertyId: string): string | undefined {
    const type = this.propertyTypeGet(propertyId);
    if (!type) {
      return;
    }
    return (
      this.dataSource
        .propertyMetaGet(type)
        .config.cellToString(
          this.dataSource.cellValueGet(rowId, propertyId),
          this.propertyDataGet(propertyId)
        ) ?? ''
    );
  }

  cellValueGet(rowId: string, propertyId: string): unknown {
    const type = this.propertyTypeGet(propertyId);
    if (!type) {
      return;
    }
    const cellValue = this.dataSource.cellValueGet(rowId, propertyId);
    return (
      this.dataSource
        .propertyMetaGet(type)
        .config.formatValue?.(cellValue, this.propertyDataGet(propertyId)) ??
      cellValue
    );
  }

  cellValueSet(rowId: string, propertyId: string, value: unknown): void {
    this.dataSource.cellValueChange(rowId, propertyId, value);
  }

  contextGet<T>(key: DataViewContextKey<T>): T | undefined {
    return this.dataSource.contextGet(key);
  }

  dataUpdate(updater: (viewData: ViewData) => Partial<ViewData>): void {
    this.dataSource.viewDataUpdate(this.id, updater);
  }

  delete(): void {
    this.manager.viewDelete(this.id);
  }

  duplicate(): void {
    this.manager.viewDuplicate(this.id);
  }

  abstract filterSet(filter: FilterGroup): void;

  IconGet(type: string): UniComponent | undefined {
    return this.dataSource.propertyMetaGet(type).renderer.icon;
  }

  abstract isShow(rowId: string): boolean;

  nameSet(name: string): void {
    this.dataUpdate(() => {
      return {
        name,
      } as ViewData;
    });
  }

  propertyAdd(position: InsertToPosition, type?: string): string {
    const id = this.dataSource.propertyAdd(position, type);
    this.propertyMove(id, position);
    return id;
  }

  propertyDataGet(propertyId: string): Record<string, unknown> {
    return this.dataSource.propertyDataGet(propertyId);
  }

  propertyDataSet(propertyId: string, data: Record<string, unknown>): void {
    this.dataSource.propertyDataSet(propertyId, data);
  }

  propertyDataTypeGet(propertyId: string): TType | undefined {
    const type = this.propertyTypeGet(propertyId);
    if (!type) {
      return;
    }
    return this.dataSource
      .propertyMetaGet(type)
      .config.type(this.propertyDataGet(propertyId));
  }

  propertyDelete(propertyId: string): void {
    this.dataSource.propertyDelete(propertyId);
  }

  propertyDuplicate(propertyId: string): void {
    const id = this.dataSource.propertyDuplicate(propertyId);
    this.propertyMove(id, {
      before: false,
      id: propertyId,
    });
  }

  abstract propertyGet(propertyId: string): Property;

  abstract propertyHideGet(propertyId: string): boolean;

  abstract propertyHideSet(propertyId: string, hide: boolean): void;

  propertyIdGetByIndex(index: number): string {
    return this.propertyIds$.value[index];
  }

  propertyIndexGet(propertyId: string): number {
    return this.propertyIds$.value.indexOf(propertyId);
  }

  propertyMetaGet(type: string): PropertyMetaConfig {
    return this.dataSource.propertyMetaGet(type);
  }

  abstract propertyMove(propertyId: string, position: InsertToPosition): void;

  propertyNameGet(propertyId: string): string {
    return this.dataSource.propertyNameGet(propertyId);
  }

  propertyNameSet(propertyId: string, name: string): void {
    this.dataSource.propertyNameSet(propertyId, name);
  }

  propertyNextGet(propertyId: string): Property | undefined {
    return this.propertyGet(
      this.propertyIdGetByIndex(this.propertyIndexGet(propertyId) + 1)
    );
  }

  propertyParseValueFromString(propertyId: string, cellData: string) {
    const type = this.propertyTypeGet(propertyId);
    if (!type) {
      return;
    }
    return (
      this.dataSource
        .propertyMetaGet(type)
        .config.cellFromString(cellData, this.propertyDataGet(propertyId)) ?? ''
    );
  }

  propertyPreGet(propertyId: string): Property | undefined {
    return this.propertyGet(
      this.propertyIdGetByIndex(this.propertyIndexGet(propertyId) - 1)
    );
  }

  propertyReadonlyGet(propertyId: string): boolean {
    return this.dataSource.propertyReadonlyGet(propertyId);
  }

  propertyTypeGet(propertyId: string): string | undefined {
    return this.dataSource.propertyTypeGet(propertyId);
  }

  propertyTypeSet(propertyId: string, type: string): void {
    this.dataSource.propertyTypeSet(propertyId, type);
  }

  rowAdd(insertPosition: InsertToPosition | number): string {
    return this.dataSource.rowAdd(insertPosition);
  }

  rowDelete(ids: string[]): void {
    this.dataSource.rowDelete(ids);
  }

  rowGet(rowId: string): Row {
    return new RowBase(this, rowId);
  }

  rowMove(rowId: string, position: InsertToPosition): void {
    this.dataSource.rowMove(rowId, position);
  }

  abstract rowNextGet(rowId: string): string;

  abstract rowPrevGet(rowId: string): string;

  setSearch(str: string): void {
    this.searchString.value = str;
  }
}
