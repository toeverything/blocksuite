import type { EditorHost } from '@blocksuite/block-std';
import { assertExists, type Disposable, Slot } from '@blocksuite/global/utils';
import { type BlockModel, Text } from '@blocksuite/store';

import { getIcon } from './block-icons.js';
import {
  databaseBlockAllColumnMap,
  databaseBlockColumns,
} from './columns/index.js';
import { HostContextKey } from './context/host-context.js';
import {
  BaseDataSource,
  type ColumnConfig,
  type ColumnMeta,
  columnPresets,
  createUniComponentFromWebComponent,
  type DetailSlots,
  insertPositionToIndex,
  type InsertToPosition,
} from './data-view/index.js';
import { map } from './data-view/utils/uni-component/operation.js';
import type { DatabaseBlockModel } from './database-model.js';
import { BlockRenderer } from './detail-panel/block-renderer.js';
import { NoteRenderer } from './detail-panel/note-renderer.js';

export type DatabaseBlockDataSourceConfig = {
  pageId: string;
  blockId: string;
};

export class DatabaseBlockDataSource extends BaseDataSource {
  get doc() {
    return this._model.doc;
  }

  get rows(): string[] {
    return this._model.children.map(v => v.id);
  }

  get properties(): string[] {
    return this._model.columns.map(column => column.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get addPropertyConfigList(): ColumnConfig<any, any, any>[] {
    return databaseBlockColumns.map(v => v.model);
  }

  override get detailSlots(): DetailSlots {
    return {
      ...super.detailSlots,
      header: map(createUniComponentFromWebComponent(BlockRenderer), props => ({
        ...props,
        host: this.host,
      })),
      note: map(createUniComponentFromWebComponent(NoteRenderer), props => ({
        ...props,
        model: this._model,
        host: this.host,
      })),
    };
  }

  private readonly _model: DatabaseBlockModel;

  private _batch = 0;

  slots = {
    update: new Slot(),
  };

  constructor(
    private host: EditorHost,
    config: DatabaseBlockDataSourceConfig
  ) {
    super();
    this._model = host.doc.collection
      .getDoc(config.pageId)
      ?.getBlockById(config.blockId) as DatabaseBlockModel;
    this._model.childrenUpdated.pipe(this.slots.update);
    this.setContext(HostContextKey, host);
  }

  private _runCapture() {
    if (this._batch) {
      return;
    }

    this._batch = requestAnimationFrame(() => {
      this.doc.captureSync();
      this._batch = 0;
    });
  }

  private getModelById(rowId: string): BlockModel | undefined {
    return this._model.children[this._model.childMap.get(rowId) ?? -1];
  }

  private newColumnName() {
    let i = 1;
    while (this._model.columns.some(column => column.name === `Column ${i}`)) {
      i++;
    }
    return `Column ${i}`;
  }

  cellChangeValue(rowId: string, propertyId: string, value: unknown): void {
    this._runCapture();

    const type = this.propertyGetType(propertyId);
    const update = this.getPropertyMeta(type).model.ops.valueUpdate;
    let newValue = value;
    if (update) {
      const old = this.cellGetValue(rowId, propertyId);
      newValue = update(old, this.propertyGetData(propertyId), value);
    }
    if (type === 'title' && newValue instanceof Text) {
      this._model.doc.transact(() => {
        this._model.text?.clear();
        this._model.text?.join(newValue);
      });
      return;
    }
    if (this._model.columns.some(v => v.id === propertyId)) {
      this._model.updateCell(rowId, {
        columnId: propertyId,
        value: newValue,
      });
      this._model.applyColumnUpdate();
    }
  }

  cellGetValue(rowId: string, propertyId: string): unknown {
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
      return model?.text;
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

  override cellGetRenderValue(rowId: string, propertyId: string): unknown {
    return this.cellGetValue(rowId, propertyId);
  }

  propertyAdd(insertToPosition: InsertToPosition, type?: string): string {
    this.doc.captureSync();
    return this._model.addColumn(
      insertToPosition,
      databaseBlockAllColumnMap[
        type ?? columnPresets.multiSelectColumnConfig.type
      ].model.create(this.newColumnName())
    );
  }

  propertyChangeData(propertyId: string, data: Record<string, unknown>): void {
    this._runCapture();

    this._model.updateColumn(propertyId, () => ({ data }));
    this._model.applyColumnUpdate();
  }

  propertyChangeName(propertyId: string, name: string): void {
    this.doc.captureSync();
    this._model.updateColumn(propertyId, () => ({ name }));
    this._model.applyColumnUpdate();
  }

  propertyChangeType(propertyId: string, toType: string): void {
    const currentType = this.propertyGetType(propertyId);
    const currentData = this.propertyGetData(propertyId);
    const rows = this.rows;
    const currentCells = rows.map(rowId =>
      this.cellGetValue(rowId, propertyId)
    );
    const result = databaseBlockAllColumnMap[currentType].model?.convertCell(
      toType,
      currentData,
      currentCells
    ) ?? {
      column: databaseBlockAllColumnMap[toType].model.defaultData(),
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

  propertyDelete(id: string): void {
    this.doc.captureSync();
    const index = this._model.findColumnIndex(id);
    if (index < 0) return;

    this.doc.transact(() => {
      this._model.columns.splice(index, 1);
    });
    this._model.applyColumnUpdate();
  }

  propertyGetData(propertyId: string): Record<string, unknown> {
    return this._model.columns.find(v => v.id === propertyId)?.data ?? {};
  }

  override propertyGetReadonly(propertyId: string): boolean {
    if (propertyId === 'type') return true;
    return false;
  }

  propertyGetName(propertyId: string): string {
    if (propertyId === 'type') {
      return 'Block Type';
    }
    return this._model.columns.find(v => v.id === propertyId)?.name ?? '';
  }

  propertyGetType(propertyId: string): string {
    if (propertyId === 'type') {
      return 'image';
    }
    return this._model.columns.find(v => v.id === propertyId)?.type ?? '';
  }

  propertyDuplicate(columnId: string): string {
    this.doc.captureSync();
    const currentSchema = this._model.getColumn(columnId);
    assertExists(currentSchema);
    const { id: copyId, ...nonIdProps } = currentSchema;
    const names = new Set(this._model.columns.map(v => v.name));
    let index = 1;
    while (names.has(`${nonIdProps.name}(${index})`)) {
      index++;
    }
    const schema = { ...nonIdProps, name: `${nonIdProps.name}(${index})` };
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

  rowAdd(insertPosition: InsertToPosition | number): string {
    this.doc.captureSync();
    const index =
      typeof insertPosition === 'number'
        ? insertPosition
        : insertPositionToIndex(insertPosition, this._model.children);
    return this.doc.addBlock('affine:paragraph', {}, this._model.id, index);
  }

  rowDelete(ids: string[]): void {
    this.doc.captureSync();
    this.doc.updateBlock(this._model, {
      children: this._model.children.filter(v => !ids.includes(v.id)),
    });
    this._model.deleteRows(ids);
  }

  override propertyGetDefaultWidth(propertyId: string): number {
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
    let lastDisposable: Disposable | undefined;
    let lastValue: unknown = this.cellGetValue(rowId, propertyId);
    const cb = () => {
      const value = this.cellGetValue(rowId, propertyId);
      const type = this.propertyGetType(propertyId);
      const onUpdate = this.getPropertyMeta(type).model.ops.onUpdate;
      if (!onUpdate) {
        if (value != lastValue) {
          callback();
        }
      } else {
        if (value != lastValue) {
          lastDisposable?.dispose();
          lastDisposable =
            value != null
              ? onUpdate(
                  value as never,
                  this.propertyGetData(propertyId),
                  callback
                )
              : undefined;
        }
      }
      lastValue = value;
    };
    return this._model.propsUpdated.on(cb);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPropertyMeta(type: string): ColumnMeta<any, any, any> {
    return databaseBlockAllColumnMap[type];
  }

  rowMove(rowId: string, position: InsertToPosition): void {
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
