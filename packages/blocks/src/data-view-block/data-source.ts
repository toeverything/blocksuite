import type { Column } from '@blocksuite/affine-model';
import type { EditorHost } from '@blocksuite/block-std';
import type { Block, Doc } from '@blocksuite/store';

import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import {
  type ColumnMeta,
  createUniComponentFromWebComponent,
  DataSourceBase,
  type DetailSlots,
} from '@blocksuite/data-view';
import { columnPresets } from '@blocksuite/data-view/column-presets';
import { assertExists, Slot } from '@blocksuite/global/utils';

import type { BlockMeta } from './block-meta/base.js';
import type { DataViewBlockModel } from './data-view-model.js';

import {
  databaseBlockAllColumnMap,
  databaseColumnConverts,
} from '../database-block/columns/index.js';
import { BlockRenderer } from '../database-block/detail-panel/block-renderer.js';
import { blockMetaMap } from './block-meta/index.js';
import { queryBlockAllColumnMap, queryBlockColumns } from './columns/index.js';

export type BlockQueryDataSourceConfig = {
  type: keyof typeof blockMetaMap;
};

// @ts-ignore
export class BlockQueryDataSource extends DataSourceBase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private columnMetaMap = new Map<string, ColumnMeta<any, any, any>>();

  private meta: BlockMeta;

  blockMap = new Map<string, Block>();

  docDisposeMap = new Map<string, () => void>();

  slots = {
    update: new Slot(),
  };

  get addPropertyConfigList(): ColumnMeta[] {
    return queryBlockColumns as ColumnMeta[];
  }

  private get blocks() {
    return [...this.blockMap.values()];
  }

  override get detailSlots(): DetailSlots {
    return {
      ...super.detailSlots,
      header: createUniComponentFromWebComponent(BlockRenderer),
    };
  }

  get properties(): string[] {
    return [
      ...this.meta.properties.map(v => v.key),
      ...this.block.columns.map(v => v.id),
    ];
  }

  get rows(): string[] {
    return this.blocks.map(v => v.id);
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
      for (const block of Object.values(collection.getDoc().blocks.peek())) {
        if (this.meta.selector(block)) {
          this.blockMap.set(block.id, block);
        }
      }
    }
    this.workspace.docs.forEach(doc => {
      this.listenToDoc(doc.getDoc());
    });
    this.workspace.slots.docAdded.on(id => {
      const doc = this.workspace.getDoc(id);
      if (doc) {
        this.listenToDoc(doc);
      }
    });
    this.workspace.slots.docRemoved.on(id => {
      this.docDisposeMap.get(id)?.();
    });
  }

  private getProperty(propertyId: string) {
    const property = this.meta.properties.find(v => v.key === propertyId);
    assertExists(property, `property ${propertyId} not found`);
    return property;
  }

  private newColumnName() {
    let i = 1;
    while (this.block.columns.some(column => column.name === `Column ${i}`)) {
      i++;
    }
    return `Column ${i}`;
  }

  cellChangeValue(rowId: string, propertyId: string, value: unknown): void {
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

  cellGetValue(rowId: string, propertyId: string): unknown {
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

  getPropertyMeta(type: string): ColumnMeta {
    const meta = this.columnMetaMap.get(type);
    if (meta) {
      return meta;
    }
    return queryBlockAllColumnMap[type];
  }

  getViewColumn(id: string) {
    return this.block.columns.find(v => v.id === id);
  }

  listenToDoc(doc: Doc) {
    this.docDisposeMap.set(
      doc.id,
      doc.slots.blockUpdated.on(v => {
        if (v.type === 'add') {
          const blockById = doc.getBlock(v.id);
          if (blockById && this.meta.selector(blockById)) {
            this.blockMap.set(v.id, blockById);
          }
        } else if (v.type === 'delete') {
          this.blockMap.delete(v.id);
        }
        this.slots.update.emit();
      }).dispose
    );
  }

  propertyAdd(
    insertToPosition: InsertToPosition,
    type: string | undefined
  ): string {
    const doc = this.block.doc;
    doc.captureSync();
    const column = databaseBlockAllColumnMap[
      type ?? columnPresets.multiSelectColumnConfig.type
    ].create(this.newColumnName());

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

  propertyChangeData(propertyId: string, data: Record<string, unknown>): void {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      viewColumn.data = data;
    }
  }

  propertyChangeName(propertyId: string, name: string): void {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      viewColumn.name = name;
    }
  }

  propertyChangeType(propertyId: string, toType: string): void {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      const currentType = viewColumn.type;
      const currentData = viewColumn.data;
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

  propertyDelete(_id: string): void {
    const index = this.block.columns.findIndex(v => v.id === _id);
    if (index >= 0) {
      this.block.columns.splice(index, 1);
    }
  }

  propertyDuplicate(_columnId: string): string {
    throw new Error('Method not implemented.');
  }

  propertyGetData(propertyId: string): Record<string, unknown> {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return viewColumn.data;
    }
    const property = this.getProperty(propertyId);
    return (
      property.getColumnData?.(this.blocks[0].model) ??
      property.columnMeta.config.defaultData()
    );
  }

  override propertyGetDefaultWidth(propertyId: string): number {
    if (this.propertyGetType(propertyId) === 'title') {
      return 260;
    }
    return super.propertyGetDefaultWidth(propertyId);
  }

  propertyGetName(propertyId: string): string {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return viewColumn.name;
    }
    if (propertyId === 'type') {
      return 'Block Type';
    }
    return this.getProperty(propertyId)?.name ?? '';
  }

  override propertyGetReadonly(propertyId: string): boolean {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return false;
    }
    if (propertyId === 'type') return true;
    return this.getProperty(propertyId)?.set == null;
  }

  propertyGetType(propertyId: string): string {
    const viewColumn = this.getViewColumn(propertyId);
    if (viewColumn) {
      return viewColumn.type;
    }
    if (propertyId === 'type') {
      return 'image';
    }
    return this.getProperty(propertyId).columnMeta.type;
  }

  rowAdd(_insertPosition: InsertToPosition | number): string {
    throw new Error('Method not implemented.');
  }

  rowDelete(_ids: string[]): void {
    throw new Error('Method not implemented.');
  }

  rowMove(_rowId: string, _position: InsertToPosition): void {}
}
