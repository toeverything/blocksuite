import { type EditorHost } from '@blocksuite/block-std';
import { assertExists, type Disposable, Slot } from '@blocksuite/global/utils';
import type { Block } from '@blocksuite/store';
import { type Doc } from '@blocksuite/store';

import { databaseBlockAllColumnMap } from '../database-block/columns/index.js';
import {
  BaseDataSource,
  type ColumnConfig,
  type ColumnMeta,
  columnPresets,
  createUniComponentFromWebComponent,
  type DetailSlots,
  insertPositionToIndex,
  type InsertToPosition,
} from '../database-block/data-view/index.js';
import { BlockRenderer } from '../database-block/detail-panel/block-renderer.js';
import type { Column } from '../database-block/index.js';
import type { BlockMeta } from './block-meta/base.js';
import { blockMetaMap } from './block-meta/index.js';
import { queryBlockAllColumnMap, queryBlockColumns } from './columns/index.js';
import type { DataViewBlockModel } from './data-view-model.js';

export type BlockQueryDataSourceConfig = {
  type: keyof typeof blockMetaMap;
};

export class BlockQueryDataSource extends BaseDataSource {
  docDisposeMap: Map<string, () => void> = new Map();
  blockMap: Map<string, Block> = new Map();
  private meta: BlockMeta;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private columnMetaMap = new Map<string, ColumnMeta<any, any, any>>();

  getViewColumn(id: string) {
    return this.block.columns.find(v => v.id === id);
  }

  get workspace() {
    return this.host.doc.collection;
  }

  constructor(
    private host: EditorHost,
    private block: DataViewBlockModel,
    config: BlockQueryDataSourceConfig
  ) {
    super();
    this.meta = blockMetaMap[config.type];
    for (const property of this.meta.properties) {
      this.columnMetaMap.set(property.columnMeta.type, property.columnMeta);
    }
    for (const collection of this.workspace.docs.values()) {
      for (const block of collection
        .getDoc(this.meta.selector)
        .blocks.values()) {
        this.blockMap.set(block.id, block);
      }
    }
    this.workspace.docs.forEach(doc => {
      this.listenToDoc(doc.getDoc(this.meta.selector));
    });
    this.workspace.slots.docAdded.on(id => {
      const doc = this.workspace.getDoc(id, this.meta.selector);
      if (doc) {
        this.listenToDoc(doc);
      }
    });
    this.workspace.slots.docRemoved.on(id => {
      this.docDisposeMap.get(id)?.();
    });
  }

  listenToDoc(doc: Doc) {
    this.docDisposeMap.set(
      doc.id,
      doc.slots.blockUpdated.on(v => {
        if (v.type === 'add') {
          const blockById = doc.getBlock(v.id);
          if (blockById) {
            this.blockMap.set(v.id, blockById);
          }
        } else if (v.type === 'delete') {
          this.blockMap.delete(v.id);
        }
        this.slots.update.emit();
      }).dispose
    );
  }

  private get blocks() {
    return [...this.blockMap.values()];
  }

  public get rows(): string[] {
    return this.blocks.map(v => v.id);
  }

  public get properties(): string[] {
    return [
      ...this.meta.properties.map(v => v.key),
      ...this.block.columns.map(v => v.id),
    ];
  }

  public slots = {
    update: new Slot(),
  };

  public cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      this.block.cells[rowId] = {
        ...this.block.cells[rowId],
        [propertyId]: value,
      };
      return;
    }
    const block = this.blockMap.get(rowId);
    if (block) {
      this.meta.properties
        .find(v => v.key === propertyId)
        ?.set?.(block.model, value);
    }
  }

  public cellGetValue(rowId: string, propertyId: string): unknown {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return this.block.cells[rowId]?.[propertyId];
    }
    const block = this.blockMap.get(rowId);
    if (block) {
      return this.getProperty(propertyId)?.get(block.model);
    }
    return;
  }

  public propertyChangeData(
    propertyId: string,
    data: Record<string, unknown>
  ): void {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      viewColumn.data = data;
    }
  }

  public propertyChangeName(propertyId: string, name: string): void {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      viewColumn.name = name;
    }
  }

  public propertyChangeType(propertyId: string, toType: string): void {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      const currentType = viewColumn.type;
      const currentData = viewColumn.data;
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
      this.block.doc.captureSync();
      viewColumn.type = toType;
      viewColumn.data = result.column;
      currentCells.forEach((value, i) => {
        if (value != null || result.cells[i] != null) {
          this.block.cells[rows[i]] = {
            ...this.block.cells[rows[i]],
            [propertyId]: result.cells[i],
          };
        }
      });
    }
  }

  public propertyDelete(_id: string): void {
    const index = this.block.columns.findIndex(v => v.id === _id);
    if (index >= 0) {
      this.block.columns.splice(index, 1);
    }
  }

  public propertyGetData(propertyId: string): Record<string, unknown> {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return viewColumn.data;
    }
    const property = this.getProperty(propertyId);
    return (
      property.getColumnData?.(this.blocks[0].model) ??
      property.columnMeta.model.defaultData()
    );
  }

  public override propertyGetReadonly(propertyId: string): boolean {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return false;
    }
    if (propertyId === 'type') return true;
    return this.getProperty(propertyId)?.set == null;
  }

  public propertyGetName(propertyId: string): string {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return viewColumn.name;
    }
    if (propertyId === 'type') {
      return 'Block Type';
    }
    return this.getProperty(propertyId)?.name ?? '';
  }

  private getProperty(propertyId: string) {
    const property = this.meta.properties.find(v => v.key === propertyId);
    assertExists(property, `property ${propertyId} not found`);
    return property;
  }

  public propertyGetType(propertyId: string): string {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return viewColumn.type;
    }
    if (propertyId === 'type') {
      return 'image';
    }
    return this.getProperty(propertyId).columnMeta.type;
  }

  public propertyDuplicate(_columnId: string): string {
    throw new Error('Method not implemented.');
  }

  public rowAdd(_insertPosition: InsertToPosition | number): string {
    throw new Error('Method not implemented.');
  }

  public rowDelete(_ids: string[]): void {
    throw new Error('Method not implemented.');
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
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return this.block.propsUpdated.on(callback);
    }
    const block = this.blockMap.get(rowId);
    assertExists(block, `block ${rowId} not found`);
    return this.getProperty(propertyId).updated(block.model, callback);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get addPropertyConfigList(): ColumnConfig<any, any, any>[] {
    return queryBlockColumns.map(v => v.model);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getPropertyMeta(type: string): ColumnMeta<any, any, any> {
    const meta = this.columnMetaMap.get(type);
    if (meta) {
      return meta;
    }
    return queryBlockAllColumnMap[type];
  }

  public override get detailSlots(): DetailSlots {
    return {
      ...super.detailSlots,
      header: createUniComponentFromWebComponent(BlockRenderer),
    };
  }

  public rowMove(_rowId: string, _position: InsertToPosition): void {}

  private newColumnName() {
    let i = 1;
    while (this.block.columns.some(column => column.name === `Column ${i}`)) {
      i++;
    }
    return `Column ${i}`;
  }

  public propertyAdd(
    insertToPosition: InsertToPosition,
    type: string | undefined
  ): string {
    const doc = this.block.doc;
    doc.captureSync();
    const column = databaseBlockAllColumnMap[
      type ?? columnPresets.multiSelectColumnConfig.type
    ].model.create(this.newColumnName());

    const id = doc.generateBlockId();
    if (this.block.columns.some(v => v.id === id)) {
      return id;
    }
    doc.transact(() => {
      const col: Column = {
        ...column,
        id,
      };
      this.block.columns.splice(
        insertPositionToIndex(insertToPosition, this.block.columns),
        0,
        col
      );
    });
    return id;
  }
}
