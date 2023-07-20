import { assertExists, Slot } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';

import { columnManager } from '../../database-block/common/column-manager.js';
import { multiSelectHelper } from '../../database-block/common/columns/define.js';
import type { DatabaseBlockModel } from '../../database-block/database-model.js';
import type { InsertPosition } from '../../database-block/index.js';
import { insertPositionToIndex } from '../../database-block/utils/insert.js';
import type { DatabaseBlockDatasourceConfig } from './base.js';
import { BaseDataSource } from './base.js';

export class DatabaseBlockDatasource extends BaseDataSource {
  private _model: DatabaseBlockModel;

  get page() {
    return this._model.page;
  }

  constructor(
    private root: BlockSuiteRoot,
    config: DatabaseBlockDatasourceConfig
  ) {
    super();
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
    this.page.captureSync();
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

  private newColumnName() {
    let i = 1;
    while (this._model.columns.find(column => column.name === `Column ${i}`)) {
      i++;
    }
    return `Column ${i}`;
  }

  public propertyAdd(insertPosition: InsertPosition): string {
    this.page.captureSync();
    return this._model.addColumn(
      insertPosition,
      multiSelectHelper.create(this.newColumnName())
    );
  }

  public propertyChangeData(
    propertyId: string,
    data: Record<string, unknown>
  ): void {
    this.page.captureSync();
    this._model.updateColumn(propertyId, () => ({ data }));
  }

  public propertyChangeName(propertyId: string, name: string): void {
    this.page.captureSync();
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
    this.page.captureSync();
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
    this.page.captureSync();
    const index = this._model.findColumnIndex(id);
    if (index < 0) return;

    this.page.transact(() => {
      this._model.columns.splice(index, 1);
    });
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
    this.page.captureSync();
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
    this.page.captureSync();
    const index = insertPositionToIndex(insertPosition, this._model.children);
    return this.page.addBlock('affine:paragraph', {}, this._model.id, index);
  }

  public rowDelete(ids: string[]): void {
    this.page.captureSync();
    this.page.updateBlock(this._model, {
      children: this._model.children.filter(v => !ids.includes(v.id)),
    });
  }

  public override captureSync(): void {
    this.page.captureSync();
  }

  public override propertyGetDefaultWidth(propertyId: string): number {
    if (this.propertyGetType(propertyId) === 'title') {
      return 432;
    }
    return super.propertyGetDefaultWidth(propertyId);
  }
}
