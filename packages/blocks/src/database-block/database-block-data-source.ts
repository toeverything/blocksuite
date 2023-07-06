import { Slot } from '@blocksuite/global/utils';

import type { DatabaseBlockModel, InsertPosition } from './database-model.js';
import type { DataSource } from './table/table-view-manager.js';

export class DatabaseBlockDataSource implements DataSource {

  constructor(private _model: DatabaseBlockModel) {
    this._model.childrenUpdated.pipe(this.slots.update);
    this._model.propsUpdated.pipe(this.slots.update);
  }

  public get rows(): string[] {
    return this._model.children.map(v => v.id);
  }

  public get properties(): string[] {
    return this._model.columns.map(column => column.id);
  }

  public getCell(rowId: string, propertyId: string): unknown {
    return this._model.getCell(rowId, propertyId);
  }

  public setCell(rowId: string, propertyId: string, value: unknown) {
    return this._model.updateCell(rowId, { columnId: propertyId, value });
  }

  public slots = {
    update: new Slot,
  };

  public cellChangeValue(rowId: string, propertyId: string, value: unknown): void {
    this._model.updateCell(rowId, { columnId: propertyId, value });
  }

  public cellGetValue(rowId: string, propertyId: string): unknown {
    return this._model.getCell(rowId, propertyId)?.value;
  }

  public propertyAdd(insertPosition: InsertPosition): string {
    return '';
  }

  public propertyChangeData(propertyId: string, data: Record<string, unknown>): void {
  }

  public propertyChangeName(propertyId: string, name: string): void {
  }

  public propertyChangeType(propertyId: string, type: string): void {
  }

  public propertyDelete(ids: string): void {
  }

  public propertyGetData(propertyId: string): Record<string, unknown> {
    return this._model.columns.find(v => v.id === propertyId)?.data ?? {};
  }

  public propertyGetName(propertyId: string): string {
    return this._model.columns.find(v => v.id === propertyId)?.name ?? '';
  }

  public propertyGetType(propertyId: string): string {
    return this._model.columns.find(v => v.id === propertyId)?.type ?? '';
  }

  public rowAdd(insertPosition: InsertPosition): string {
    return '';
  }

  public rowDelete(ids: string[]): void {
  }
}