import type { DatabaseBlockModel } from '@blocksuite/affine-model';
import type { EditorHost } from '@blocksuite/block-std';

import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import {
  type DatabaseFlags,
  DataSourceBase,
  type DataViewDataType,
  getTagColor,
  type PropertyMetaConfig,
  type TType,
  type ViewManager,
  ViewManagerBase,
  type ViewMeta,
} from '@blocksuite/data-view';
import { propertyPresets } from '@blocksuite/data-view/property-presets';
import { assertExists } from '@blocksuite/global/utils';
import { type BlockModel, nanoid, Text } from '@blocksuite/store';
import { computed, type ReadonlySignal } from '@preact/signals-core';

import { getIcon } from './block-icons.js';
import {
  databaseBlockAllPropertyMap,
  databaseBlockPropertyList,
  databasePropertyConverts,
} from './properties/index.js';
import { titlePurePropertyConfig } from './properties/title/define.js';
import {
  addProperty,
  applyCellsUpdate,
  applyPropertyUpdate,
  copyCellsByProperty,
  deleteRows,
  deleteView,
  duplicateView,
  findPropertyIndex,
  getCell,
  getProperty,
  moveViewTo,
  updateCell,
  updateCells,
  updateProperty,
  updateView,
} from './utils.js';
import {
  databaseBlockViewConverts,
  databaseBlockViewMap,
  databaseBlockViews,
} from './views/index.js';

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

  get doc() {
    return this._model.doc;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get propertyMetas(): PropertyMetaConfig<any, any, any>[] {
    return databaseBlockPropertyList;
  }

  constructor(model: DatabaseBlockModel) {
    super();
    this._model = model;
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

  private newPropertyName() {
    let i = 1;
    while (
      this._model.columns$.value.some(column => column.name === `Column ${i}`)
    ) {
      i++;
    }
    return `Column ${i}`;
  }

  cellValueChange(rowId: string, propertyId: string, value: unknown): void {
    this._runCapture();

    const type = this.propertyTypeGet(propertyId);
    const update = this.propertyMetaGet(type).config.valueUpdate;
    let newValue = value;
    if (update) {
      const old = this.cellValueGet(rowId, propertyId);
      newValue = update(old, this.propertyDataGet(propertyId), value);
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

  cellValueGet(rowId: string, propertyId: string): unknown {
    if (propertyId === 'type') {
      const model = this.getModelById(rowId);
      if (!model) {
        return;
      }
      return getIcon(model);
    }
    const type = this.propertyTypeGet(propertyId);
    if (type === 'title') {
      const model = this.getModelById(rowId);
      return model?.text;
    }
    return getCell(this._model, rowId, propertyId)?.value;
  }

  propertyAdd(insertToPosition: InsertToPosition, type?: string): string {
    this.doc.captureSync();
    const result = addProperty(
      this._model,
      insertToPosition,
      databaseBlockAllPropertyMap[
        type ?? propertyPresets.multiSelectPropertyConfig.type
      ].create(this.newPropertyName())
    );
    applyPropertyUpdate(this._model);
    return result;
  }

  propertyDataGet(propertyId: string): Record<string, unknown> {
    return (
      this._model.columns$.value.find(v => v.id === propertyId)?.data ?? {}
    );
  }

  propertyDataSet(propertyId: string, data: Record<string, unknown>): void {
    this._runCapture();

    updateProperty(this._model, propertyId, () => ({ data }));
    applyPropertyUpdate(this._model);
  }

  propertyDataTypeGet(propertyId: string): TType | undefined {
    const data = this._model.columns$.value.find(v => v.id === propertyId);
    if (!data) {
      return;
    }
    const meta = this.propertyMetaGet(data.type);
    return meta.config.type(data);
  }

  propertyDelete(id: string): void {
    this.doc.captureSync();
    const index = findPropertyIndex(this._model, id);
    if (index < 0) return;

    this.doc.transact(() => {
      this._model.columns = this._model.columns.filter((_, i) => i !== index);
    });
  }

  propertyDuplicate(propertyId: string): string {
    this.doc.captureSync();
    const currentSchema = getProperty(this._model, propertyId);
    assertExists(currentSchema);
    const { id: copyId, ...nonIdProps } = currentSchema;
    const names = new Set(this._model.columns$.value.map(v => v.name));
    let index = 1;
    while (names.has(`${nonIdProps.name}(${index})`)) {
      index++;
    }
    const schema = { ...nonIdProps, name: `${nonIdProps.name}(${index})` };
    const id = addProperty(
      this._model,
      {
        before: false,
        id: propertyId,
      },
      schema
    );
    copyCellsByProperty(this._model, copyId, id);
    applyPropertyUpdate(this._model);
    return id;
  }

  propertyMetaGet(type: string): PropertyMetaConfig {
    return databaseBlockAllPropertyMap[type];
  }

  propertyNameGet(propertyId: string): string {
    if (propertyId === 'type') {
      return 'Block Type';
    }
    return (
      this._model.columns$.value.find(v => v.id === propertyId)?.name ?? ''
    );
  }

  propertyNameSet(propertyId: string, name: string): void {
    this.doc.captureSync();
    updateProperty(this._model, propertyId, () => ({ name }));
    applyPropertyUpdate(this._model);
  }

  override propertyReadonlyGet(propertyId: string): boolean {
    if (propertyId === 'type') return true;
    return false;
  }

  propertyTypeGet(propertyId: string): string {
    if (propertyId === 'type') {
      return 'image';
    }
    return (
      this._model.columns$.value.find(v => v.id === propertyId)?.type ?? ''
    );
  }

  propertyTypeSet(propertyId: string, toType: string): void {
    const currentType = this.propertyTypeGet(propertyId);
    const currentData = this.propertyDataGet(propertyId);
    const rows = this.rows$.value;
    const currentCells = rows.map(rowId =>
      this.cellValueGet(rowId, propertyId)
    );
    const convertFunction = databasePropertyConverts.find(
      v => v.from === currentType && v.to === toType
    )?.convert;
    const result = convertFunction?.(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentData as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentCells as any
    ) ?? {
      property: databaseBlockAllPropertyMap[toType].config.defaultData(),
      cells: currentCells.map(() => undefined),
    };
    this.doc.captureSync();
    updateProperty(this._model, propertyId, () => ({
      type: toType,
      data: result.property,
    }));
    const cells: Record<string, unknown> = {};
    currentCells.forEach((value, i) => {
      if (value != null || result.cells[i] != null) {
        cells[rows[i]] = result.cells[i];
      }
    });
    updateCells(this._model, propertyId, cells);
    applyPropertyUpdate(this._model);
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
  model: DatabaseBlockModel,
  viewType: string
) => {
  const dataSource = new DatabaseBlockDataSource(model);
  dataSource.viewManager.viewAdd(viewType);
};
export const databaseViewInitEmpty = (
  model: DatabaseBlockModel,
  viewType: string
) => {
  addProperty(
    model,
    'start',
    titlePurePropertyConfig.create(titlePurePropertyConfig.config.name)
  );
  databaseViewAddView(model, viewType);
};
export const databaseViewInitConvert = (
  model: DatabaseBlockModel,
  viewType: string
) => {
  addProperty(
    model,
    'end',
    propertyPresets.multiSelectPropertyConfig.create('Tag', { options: [] })
  );
  databaseViewInitEmpty(model, viewType);
};
export const databaseViewInitTemplate = (
  model: DatabaseBlockModel,
  viewType: string
) => {
  const ids = [nanoid(), nanoid(), nanoid()];
  const statusId = addProperty(
    model,
    'end',
    propertyPresets.selectPropertyConfig.create('Status', {
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
  databaseViewInitEmpty(model, viewType);
};
export const convertToDatabase = (host: EditorHost, viewType: string) => {
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
  databaseViewInitConvert(databaseModel, viewType);
  applyPropertyUpdate(databaseModel);
  host.doc.moveBlocks(selectedModels, databaseModel);

  const selectionManager = host.selection;
  selectionManager.clear();
};
