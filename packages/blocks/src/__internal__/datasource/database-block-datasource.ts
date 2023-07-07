import { assertExists, Slot } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';

import {
  columnManager,
  multiSelectHelper,
} from '../../database-block/common/column-manager.js';
import type {
  DatabaseBlockModel,
  InsertPosition,
} from '../../database-block/database-model.js';
import { insertPositionToIndex } from '../../database-block/database-model.js';
import type { DataSource } from '../../database-block/table/table-view-manager.js';
import type { DatabaseBlockDatasourceConfig } from './datasource-manager.js';

export class DatabaseBlockDatasource implements DataSource {
  private _model: DatabaseBlockModel;

  constructor(
    private root: BlockSuiteRoot,
    config: DatabaseBlockDatasourceConfig
  ) {
    this._model = root.page.workspace
      .getPage(config.pageId)
      ?.getBlockById(config.blockId) as DatabaseBlockModel;
    this._model.childrenUpdated.pipe(this.slots.update);
    this._model.propsUpdated.pipe(this.slots.update);
  }

  public get rows(): string[] {
    return this._model.children.map(v => v.id);
  }

  public get properties(): string[] {
    return this._model.columns.map(column => column.id);
  }

  public slots = {
    update: new Slot(),
  };

  public cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    this._model.page.captureSync();
    this._model.updateCell(rowId, { columnId: propertyId, value });
  }

  public cellGetValue(rowId: string, propertyId: string): unknown {
    const type = this.propertyGetType(propertyId);
    if (type === 'title') {
      const model = this._model.children[this._model.childMap.get(rowId) ?? -1];
      if (model) {
        return model.text?.yText;
      }
      return;
    }
    return this._model.getCell(rowId, propertyId)?.value;
  }

  public cellGetRenderValue(rowId: string, propertyId: string): unknown {
    const type = this.propertyGetType(propertyId);
    if (type === 'title') {
      const model = this._model.children[this._model.childMap.get(rowId) ?? -1];
      if (model) {
        return this.root.renderModel(model);
      }
      return;
    }
    return this._model.getCell(rowId, propertyId)?.value;
  }

  public propertyAdd(insertPosition: InsertPosition): string {
    this._model.page.captureSync();
    return this._model.addColumn(
      insertPosition,
      multiSelectHelper.create('Column')
    );
  }

  public propertyChangeData(
    propertyId: string,
    data: Record<string, unknown>
  ): void {
    this._model.page.captureSync();
    this._model.updateColumn(propertyId, () => ({ data }));
  }

  public propertyChangeName(propertyId: string, name: string): void {
    this._model.page.captureSync();
    this._model.updateColumn(propertyId, () => ({ name }));
  }

  public propertyChangeType(propertyId: string, toType: string): void {
    const currentType = this.propertyGetType(propertyId);
    const currentData = this.propertyGetData(propertyId);
    const rows = this.rows;
    const currentCells = rows.map(rowId =>
      this.cellGetValue(rowId, propertyId)
    );
    const result = columnManager.convertCell(
      currentType,
      toType,
      currentData,
      currentCells
    ) ?? {
      column: columnManager.defaultData(toType),
      cells: currentCells.map(() => undefined),
    };
    this._model.page.captureSync();
    this._model.updateColumn(propertyId, () => ({
      type: toType,
      data: result.column,
    }));
    const cells: Record<string, unknown> = {};
    currentCells.forEach((value, i) => {
      if (value != null || result.cells[i] != null) {
        cells[rows[i]] = result.cells[i];
      }
    });
    this._model.updateCells(propertyId, cells);
  }

  public propertyDelete(id: string): void {
    this._model.page.captureSync();
    this._model.deleteColumn(id);
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

  public propertyDuplicate(columnId: string): string {
    this._model.page.captureSync();
    const currentSchema = this._model.getColumn(columnId);
    assertExists(currentSchema);
    const { id: copyId, ...nonIdProps } = currentSchema;
    const schema = { ...nonIdProps };
    const id = this._model.addColumn({ before: false, id: columnId }, schema);
    this._model.applyColumnUpdate();
    this._model.copyCellsByColumn(copyId, id);
    return id;
  }

  public rowAdd(insertPosition: InsertPosition): string {
    this._model.page.captureSync();
    const index = insertPositionToIndex(insertPosition, this._model.children);
    return this._model.page.addBlock(
      'affine:paragraph',
      {},
      this._model.id,
      index
    );
  }

  public rowDelete(ids: string[]): void {
    this._model.page.captureSync();
    this._model.page.updateBlock(this._model, {
      children: this._model.children.filter(v => !ids.includes(v.id)),
    });
  }
}
