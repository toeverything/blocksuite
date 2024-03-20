import type { EditorHost } from '@blocksuite/block-std';
import type { Disposable } from '@blocksuite/global/utils';
import { assertExists, Slot } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import { Text, type Y } from '@blocksuite/store';

import { createUniComponentFromWebComponent } from '../../../_common/components/uni-component/uni-component.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import type { InsertToPosition } from '../../types.js';
import { insertPositionToIndex } from '../../utils/insert.js';
import { checkboxColumnConfig } from '../columns/checkbox/cell-renderer.js';
import { dateColumnConfig } from '../columns/date/cell-renderer.js';
import { imageColumnConfig } from '../columns/image/cell-renderer.js';
import { linkColumnConfig } from '../columns/link/cell-renderer.js';
import type { ColumnConfig } from '../columns/manager.js';
import { columnManager } from '../columns/manager.js';
import { multiSelectColumnConfig } from '../columns/multi-select/cell-renderer.js';
import { multiSelectPureColumnConfig } from '../columns/multi-select/define.js';
import { numberColumnConfig } from '../columns/number/cell-renderer.js';
import { progressColumnConfig } from '../columns/progress/cell-renderer.js';
import { richTextColumnConfig } from '../columns/rich-text/cell-renderer.js';
import { selectColumnConfig } from '../columns/select/cell-renderer.js';
import { titleColumnConfig } from '../columns/title/cell-renderer.js';
import type { DatabaseBlockDatasourceConfig, DetailSlots } from './base.js';
import { BaseDataSource } from './base.js';
import { getIcon } from './block-icons.js';
import { BlockRenderer } from './block-renderer.js';

export class DatabaseBlockDatasource extends BaseDataSource {
  private _model: DatabaseBlockModel;
  private _batch = 0;

  get doc() {
    return this._model.doc;
  }

  constructor(
    private host: EditorHost,
    config: DatabaseBlockDatasourceConfig
  ) {
    super();
    this._model = host.doc.collection
      .getDoc(config.pageId)
      ?.getBlockById(config.blockId) as DatabaseBlockModel;
    this._model.childrenUpdated.pipe(this.slots.update);
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

  private _runCapture() {
    if (this._batch) {
      return;
    }

    this._batch = requestAnimationFrame(() => {
      this.doc.captureSync();
      this._batch = 0;
    });
  }

  public cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    this._runCapture();

    const type = this.propertyGetType(propertyId);
    if (type === 'title' && typeof value === 'string') {
      const text = this.getModelById(rowId)?.text;
      if (text) {
        text.replace(0, text.length, value);
      }
      this.slots.update.emit();
      return;
    } else if (type === 'rich-text' && typeof value === 'string') {
      const cell = this._model.getCell(rowId, propertyId);
      const yText = cell?.value as Y.Text | undefined;
      if (yText) {
        const text = new Text(yText);
        text.replace(0, text.length, value);
      }
      return;
    }
    if (this._model.columns.some(v => v.id === propertyId)) {
      this._model.updateCell(rowId, {
        columnId: propertyId,
        value,
      });
      this._model.applyColumnUpdate();
    }
  }

  public cellGetValue(rowId: string, propertyId: string): unknown {
    if (propertyId === 'type') {
      const model = this.getModelById(rowId);
      if (!model) {
        return;
      }
      return getIcon(model);
    }
    const type = this.propertyGetType(propertyId);
    if (type === 'title') {
      const model = this.getModelById(rowId);
      if (model) {
        return model.text?.yText;
      }
      return;
    }
    return this._model.getCell(rowId, propertyId)?.value;
  }

  override cellGetExtra(rowId: string, propertyId: string): unknown {
    if (this.propertyGetType(propertyId) === 'title') {
      const model = this.getModelById(rowId);
      if (model) {
        return {
          result: this.host.renderModel(model),
          model,
        };
      }
    }
    return super.cellGetExtra(rowId, propertyId);
  }

  private getModelById(rowId: string): BlockModel | undefined {
    return this._model.children[this._model.childMap.get(rowId) ?? -1];
  }

  public override cellGetRenderValue(
    rowId: string,
    propertyId: string
  ): unknown {
    return this.cellGetValue(rowId, propertyId);
  }

  private newColumnName() {
    let i = 1;
    while (this._model.columns.some(column => column.name === `Column ${i}`)) {
      i++;
    }
    return `Column ${i}`;
  }

  public propertyAdd(
    insertToPosition: InsertToPosition,
    type?: string
  ): string {
    this.doc.captureSync();
    return this._model.addColumn(
      insertToPosition,
      columnManager
        .getColumn(type ?? multiSelectPureColumnConfig.type)
        .create(this.newColumnName())
    );
  }

  public propertyChangeData(
    propertyId: string,
    data: Record<string, unknown>
  ): void {
    this._runCapture();

    this._model.updateColumn(propertyId, () => ({ data }));
    this._model.applyColumnUpdate();
  }

  public propertyChangeName(propertyId: string, name: string): void {
    this.doc.captureSync();
    this._model.updateColumn(propertyId, () => ({ name }));
    this._model.applyColumnUpdate();
  }

  public propertyChangeType(propertyId: string, toType: string): void {
    const currentType = this.propertyGetType(propertyId);
    const currentData = this.propertyGetData(propertyId);
    const rows = this.rows;
    const currentCells = rows.map(rowId =>
      this.cellGetValue(rowId, propertyId)
    );
    const result = columnManager
      .getColumn(currentType)
      ?.convertCell(toType, currentData, currentCells) ?? {
      column: columnManager.getColumn(toType).defaultData(),
      cells: currentCells.map(() => undefined),
    };
    this.doc.captureSync();
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
    this._model.applyColumnUpdate();
  }

  public propertyDelete(id: string): void {
    this.doc.captureSync();
    const index = this._model.findColumnIndex(id);
    if (index < 0) return;

    this.doc.transact(() => {
      this._model.columns.splice(index, 1);
    });
    this._model.applyColumnUpdate();
  }

  public propertyGetData(propertyId: string): Record<string, unknown> {
    return this._model.columns.find(v => v.id === propertyId)?.data ?? {};
  }

  public override propertyGetReadonly(propertyId: string): boolean {
    if (propertyId === 'type') return true;
    return false;
  }

  public propertyGetName(propertyId: string): string {
    if (propertyId === 'type') {
      return 'Block Type';
    }
    return this._model.columns.find(v => v.id === propertyId)?.name ?? '';
  }

  public propertyGetType(propertyId: string): string {
    if (propertyId === 'type') {
      return 'image';
    }
    return this._model.columns.find(v => v.id === propertyId)?.type ?? '';
  }

  public propertyDuplicate(columnId: string): string {
    this.doc.captureSync();
    const currentSchema = this._model.getColumn(columnId);
    assertExists(currentSchema);
    const { id: copyId, ...nonIdProps } = currentSchema;
    const schema = { ...nonIdProps };
    const id = this._model.addColumn(
      {
        before: false,
        id: columnId,
      },
      schema
    );
    this._model.copyCellsByColumn(copyId, id);
    this._model.applyColumnUpdate();
    return id;
  }

  public rowAdd(insertPosition: InsertToPosition | number): string {
    this.doc.captureSync();
    const index =
      typeof insertPosition === 'number'
        ? insertPosition
        : insertPositionToIndex(insertPosition, this._model.children);
    return this.doc.addBlock('affine:paragraph', {}, this._model.id, index);
  }

  public rowDelete(ids: string[]): void {
    this.doc.captureSync();
    this.doc.updateBlock(this._model, {
      children: this._model.children.filter(v => !ids.includes(v.id)),
    });
  }

  public override captureSync(): void {
    this.doc.captureSync();
  }

  public override propertyGetDefaultWidth(propertyId: string): number {
    if (this.propertyGetType(propertyId) === 'title') {
      return 260;
    }
    return super.propertyGetDefaultWidth(propertyId);
  }

  override onCellUpdate(
    rowId: string,
    propertyId: string,
    callback: () => void
  ): Disposable {
    if (this.propertyGetType(propertyId) === 'title') {
      this.getModelById(rowId)?.text?.yText.observe(callback);
      return {
        dispose: () => {
          this.getModelById(rowId)?.text?.yText.unobserve(callback);
        },
      };
    }
    return this._model.propsUpdated.on(callback);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get allPropertyConfig(): ColumnConfig<any, any>[] {
    return [
      dateColumnConfig,
      numberColumnConfig,
      progressColumnConfig,
      selectColumnConfig,
      multiSelectColumnConfig,
      richTextColumnConfig,
      linkColumnConfig,
      checkboxColumnConfig,
    ];
  }

  public override get detailSlots(): DetailSlots {
    return {
      ...super.detailSlots,
      header: createUniComponentFromWebComponent(BlockRenderer),
    };
  }

  public rowMove(rowId: string, position: InsertToPosition): void {
    const model = this.doc.getBlockById(rowId);
    if (model) {
      const index = insertPositionToIndex(position, this._model.children);
      const target = this._model.children[index];
      if (target.id === rowId) {
        return;
      }
      this.doc.moveBlocks([model], this._model, target);
    }
  }
}

export const hiddenColumn = [titleColumnConfig, imageColumnConfig];
