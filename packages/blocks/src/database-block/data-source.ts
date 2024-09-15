import type { DatabaseBlockModel } from '@blocksuite/affine-model';
import type { EditorHost } from '@blocksuite/block-std';

import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import {
  type ColumnMeta,
  createUniComponentFromWebComponent,
  type DatabaseFlags,
  DataSourceBase,
  type DataViewDataType,
  type DetailSlots,
  getTagColor,
  type TType,
  uniMap,
  type ViewManager,
  ViewManagerBase,
  type ViewMeta,
} from '@blocksuite/data-view';
import { columnPresets } from '@blocksuite/data-view/column-presets';
import { assertExists } from '@blocksuite/global/utils';
import { type BlockModel, nanoid, Text } from '@blocksuite/store';
import { computed, type ReadonlySignal } from '@preact/signals-core';

import { getIcon } from './block-icons.js';
import {
  databaseBlockAllColumnMap,
  databaseBlockColumnList,
  databaseColumnConverts,
} from './columns/index.js';
import { titlePureColumnConfig } from './columns/title/define.js';
import { HostContextKey } from './context/host-context.js';
import { BlockRenderer } from './detail-panel/block-renderer.js';
import { NoteRenderer } from './detail-panel/note-renderer.js';
import {
  addColumn,
  applyCellsUpdate,
  applyColumnUpdate,
  copyCellsByColumn,
  deleteRows,
  deleteView,
  duplicateView,
  findColumnIndex,
  getCell,
  getColumn,
  moveViewTo,
  updateCell,
  updateCells,
  updateColumn,
  updateView,
} from './utils.js';
import {
  databaseBlockViewConverts,
  databaseBlockViewMap,
  databaseBlockViews,
} from './views/index.js';

export type DatabaseBlockDataSourceConfig = {
  pageId: string;
  blockId: string;
};

export class DatabaseBlockDataSource extends DataSourceBase {
  private _batch = 0;

  private readonly _model: DatabaseBlockModel;

  override featureFlags$: ReadonlySignal<DatabaseFlags> = computed(() => {
    return {
      enable_number_formatting:
        this.doc.awarenessStore.getFlag('enable_database_number_formatting') ??
        false,
    };
  });

  properties$: ReadonlySignal<string[]> = computed(() => {
    return this._model.columns$.value.map(column => column.id);
  });

  readonly$: ReadonlySignal<boolean> = computed(() => {
    return this._model.doc.awarenessStore.isReadonly(
      this._model.doc.blockCollection
    );
  });

  rows$: ReadonlySignal<string[]> = computed(() => {
    return this._model.children.map(v => v.id);
  });

  viewConverts = databaseBlockViewConverts;

  viewDataList$: ReadonlySignal<DataViewDataType[]> = computed(() => {
    return this._model.views$.value as DataViewDataType[];
  });

  override viewManager: ViewManager = new ViewManagerBase(this);

  viewMetas = databaseBlockViews;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get addPropertyConfigList(): ColumnMeta<any, any, any>[] {
    return databaseBlockColumnList;
  }

  override get detailSlots(): DetailSlots {
    return {
      ...super.detailSlots,
      header: uniMap(
        createUniComponentFromWebComponent(BlockRenderer),
        props => ({
          ...props,
          host: this.host,
        })
      ),
      note: uniMap(createUniComponentFromWebComponent(NoteRenderer), props => ({
        ...props,
        model: this._model,
        host: this.host,
      })),
    };
  }

  get doc() {
    return this._model.doc;
  }

  constructor(
    private host: EditorHost,
    config: DatabaseBlockDataSourceConfig
  ) {
    super();
    this._model = host.doc.collection
      .getDoc(config.pageId)
      ?.getBlockById(config.blockId) as DatabaseBlockModel;
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
    return this._model.children[this._model.childMap.value.get(rowId) ?? -1];
  }

  private newColumnName() {
    let i = 1;
    while (
      this._model.columns$.value.some(column => column.name === `Column ${i}`)
    ) {
      i++;
    }
    return `Column ${i}`;
  }

  cellChangeValue(rowId: string, propertyId: string, value: unknown): void {
    this._runCapture();

    const type = this.propertyGetType(propertyId);
    const update = this.getPropertyMeta(type).config.valueUpdate;
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
    if (this._model.columns$.value.some(v => v.id === propertyId)) {
      updateCell(this._model, rowId, {
        columnId: propertyId,
        value: newValue,
      });
      applyCellsUpdate(this._model);
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
    return getCell(this._model, rowId, propertyId)?.value;
  }

  getPropertyMeta(type: string): ColumnMeta {
    return databaseBlockAllColumnMap[type];
  }

  propertyAdd(insertToPosition: InsertToPosition, type?: string): string {
    this.doc.captureSync();
    const result = addColumn(
      this._model,
      insertToPosition,
      databaseBlockAllColumnMap[
        type ?? columnPresets.multiSelectColumnConfig.type
      ].create(this.newColumnName())
    );
    applyColumnUpdate(this._model);
    return result;
  }

  propertyChangeData(propertyId: string, data: Record<string, unknown>): void {
    this._runCapture();

    updateColumn(this._model, propertyId, () => ({ data }));
    applyColumnUpdate(this._model);
  }

  propertyChangeName(propertyId: string, name: string): void {
    this.doc.captureSync();
    updateColumn(this._model, propertyId, () => ({ name }));
    applyColumnUpdate(this._model);
  }

  propertyChangeType(propertyId: string, toType: string): void {
    const currentType = this.propertyGetType(propertyId);
    const currentData = this.propertyGetData(propertyId);
    const rows = this.rows$.value;
    const currentCells = rows.map(rowId =>
      this.cellGetValue(rowId, propertyId)
    );
    const convertFunction = databaseColumnConverts.find(
      v => v.from === currentType && v.to === toType
    )?.convert;
    const result = convertFunction?.(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentData as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentCells as any
    ) ?? {
      column: databaseBlockAllColumnMap[toType].config.defaultData(),
      cells: currentCells.map(() => undefined),
    };
    this.doc.captureSync();
    updateColumn(this._model, propertyId, () => ({
      type: toType,
      data: result.column,
    }));
    const cells: Record<string, unknown> = {};
    currentCells.forEach((value, i) => {
      if (value != null || result.cells[i] != null) {
        cells[rows[i]] = result.cells[i];
      }
    });
    updateCells(this._model, propertyId, cells);
    applyColumnUpdate(this._model);
  }

  propertyDelete(id: string): void {
    this.doc.captureSync();
    const index = findColumnIndex(this._model, id);
    if (index < 0) return;

    this.doc.transact(() => {
      this._model.columns = this._model.columns.filter((_, i) => i !== index);
    });
  }

  propertyDuplicate(columnId: string): string {
    this.doc.captureSync();
    const currentSchema = getColumn(this._model, columnId);
    assertExists(currentSchema);
    const { id: copyId, ...nonIdProps } = currentSchema;
    const names = new Set(this._model.columns$.value.map(v => v.name));
    let index = 1;
    while (names.has(`${nonIdProps.name}(${index})`)) {
      index++;
    }
    const schema = { ...nonIdProps, name: `${nonIdProps.name}(${index})` };
    const id = addColumn(
      this._model,
      {
        before: false,
        id: columnId,
      },
      schema
    );
    copyCellsByColumn(this._model, copyId, id);
    applyColumnUpdate(this._model);
    return id;
  }

  propertyGetData(propertyId: string): Record<string, unknown> {
    return (
      this._model.columns$.value.find(v => v.id === propertyId)?.data ?? {}
    );
  }

  propertyGetDataType(propertyId: string): TType | undefined {
    const data = this._model.columns$.value.find(v => v.id === propertyId);
    if (!data) {
      return;
    }
    const meta = this.getPropertyMeta(data.type);
    return meta.config.type(data);
  }

  override propertyGetDefaultWidth(propertyId: string): number {
    if (this.propertyGetType(propertyId) === 'title') {
      return 260;
    }
    return super.propertyGetDefaultWidth(propertyId);
  }

  propertyGetName(propertyId: string): string {
    if (propertyId === 'type') {
      return 'Block Type';
    }
    return (
      this._model.columns$.value.find(v => v.id === propertyId)?.name ?? ''
    );
  }

  override propertyGetReadonly(propertyId: string): boolean {
    if (propertyId === 'type') return true;
    return false;
  }

  propertyGetType(propertyId: string): string {
    if (propertyId === 'type') {
      return 'image';
    }
    return (
      this._model.columns$.value.find(v => v.id === propertyId)?.type ?? ''
    );
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
    deleteRows(this._model, ids);
  }

  rowMove(rowId: string, position: InsertToPosition): void {
    const model = this.doc.getBlockById(rowId);
    if (model) {
      const index = insertPositionToIndex(position, this._model.children);
      const target = this._model.children[index];
      if (target?.id === rowId) {
        return;
      }
      this.doc.moveBlocks([model], this._model, target);
    }
  }

  viewDataAdd(viewData: DataViewDataType): string {
    this._model.doc.captureSync();
    this._model.doc.transact(() => {
      this._model.views = [...this._model.views, viewData];
    });
    return viewData.id;
  }

  viewDataDelete(viewId: string): void {
    this._model.doc.captureSync();
    deleteView(this._model, viewId);
  }

  viewDataDuplicate(id: string): string {
    return duplicateView(this._model, id);
  }

  viewDataGet(viewId: string): DataViewDataType {
    return this.viewDataList$.value.find(data => data.id === viewId)!;
  }

  viewDataMoveTo(id: string, position: InsertToPosition): void {
    moveViewTo(this._model, id, position);
  }

  viewDataUpdate<ViewData extends DataViewDataType>(
    id: string,
    updater: (data: ViewData) => Partial<ViewData>
  ): void {
    updateView(this._model, id, updater);
  }

  viewMetaGet(type: string): ViewMeta {
    return databaseBlockViewMap[type];
  }

  viewMetaGetById(viewId: string): ViewMeta {
    const view = this.viewDataGet(viewId);
    return this.viewMetaGet(view.mode);
  }
}

export const databaseViewAddView = (
  host: EditorHost,
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  const dataSource = new DatabaseBlockDataSource(host, {
    pageId: model.doc.id,
    blockId: model.id,
  });
  dataSource.viewManager.viewAdd(viewMeta.type);
};
export const databaseViewInitEmpty = (
  host: EditorHost,
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  addColumn(
    model,
    'start',
    titlePureColumnConfig.create(titlePureColumnConfig.config.name)
  );
  databaseViewAddView(host, model, viewMeta);
};
export const databaseViewInitConvert = (
  host: EditorHost,
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  addColumn(
    model,
    'end',
    columnPresets.multiSelectColumnConfig.create('Tag', { options: [] })
  );
  databaseViewInitEmpty(host, model, viewMeta);
};
export const databaseViewInitTemplate = (
  host: EditorHost,
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  const ids = [nanoid(), nanoid(), nanoid()];
  const statusId = addColumn(
    model,
    'end',
    columnPresets.selectColumnConfig.create('Status', {
      options: [
        {
          id: ids[0],
          color: getTagColor(),
          value: 'TODO',
        },
        {
          id: ids[1],
          color: getTagColor(),
          value: 'In Progress',
        },
        {
          id: ids[2],
          color: getTagColor(),
          value: 'Done',
        },
      ],
    })
  );
  for (let i = 0; i < 4; i++) {
    const rowId = model.doc.addBlock(
      'affine:paragraph',
      {
        text: new model.doc.Text(`Task ${i + 1}`),
      },
      model.id
    );
    updateCell(model, rowId, {
      columnId: statusId,
      value: ids[i],
    });
  }
  databaseViewInitEmpty(host, model, viewMeta);
};
export const convertToDatabase = (host: EditorHost, viewMeta: ViewMeta) => {
  const [_, ctx] = host.std.command
    .chain()
    .getSelectedModels({
      types: ['block', 'text'],
    })
    .run();
  const { selectedModels } = ctx;
  if (!selectedModels || selectedModels.length === 0) return;

  host.doc.captureSync();

  const parentModel = host.doc.getParent(selectedModels[0]);
  if (!parentModel) {
    return;
  }

  const id = host.doc.addBlock(
    'affine:database',
    {},
    parentModel,
    parentModel.children.indexOf(selectedModels[0])
  );
  const databaseModel = host.doc.getBlock(id)?.model as
    | DatabaseBlockModel
    | undefined;
  if (!databaseModel) {
    return;
  }
  databaseViewInitConvert(host, databaseModel, viewMeta);
  applyColumnUpdate(databaseModel);
  host.doc.moveBlocks(selectedModels, databaseModel);

  const selectionManager = host.selection;
  selectionManager.clear();
};
