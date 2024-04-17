import { type EditorHost } from '@blocksuite/block-std';
import { assertExists, type Disposable, Slot } from '@blocksuite/global/utils';
import type { Block } from '@blocksuite/store';
import { type Doc } from '@blocksuite/store';

import {
  BaseDataSource,
  type ColumnConfig,
  type ColumnMeta,
  createUniComponentFromWebComponent,
  type DetailSlots,
  type InsertToPosition,
} from '../database-block/data-view/index.js';
import { BlockRenderer } from '../database-block/detail-panel/block-renderer.js';
import type { BlockMeta } from './block-meta/base.js';
import { blockMetaMap } from './block-meta/index.js';

export type BlockQueryDataSourceConfig = {
  type: keyof typeof blockMetaMap;
};

export class BlockQueryDataSource extends BaseDataSource {
  docDisposeMap: Map<string, () => void> = new Map();
  blockMap: Map<string, Block> = new Map();
  private meta: BlockMeta;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private columnMetaMap = new Map<string, ColumnMeta<any, any, any>>();

  get workspace() {
    return this.host.doc.collection;
  }

  constructor(
    private host: EditorHost,
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
    return this.meta.properties.map(v => v.key);
  }

  public slots = {
    update: new Slot(),
  };

  public cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    const block = this.blockMap.get(rowId);
    if (block) {
      this.meta.properties
        .find(v => v.key === propertyId)
        ?.set?.(block.model, value);
    }
  }

  public cellGetValue(rowId: string, propertyId: string): unknown {
    const block = this.blockMap.get(rowId);
    if (block) {
      return this.getProperty(propertyId)?.get(block.model);
    }
    return;
  }

  public propertyChangeData(
    _propertyId: string,
    _data: Record<string, unknown>
  ): void {
    // TODO
  }

  public propertyChangeName(_propertyId: string, _name: string): void {}

  public propertyChangeType(_propertyId: string, _toType: string): void {}

  public propertyDelete(_id: string): void {}

  public propertyGetData(_propertyId: string): Record<string, unknown> {
    const property = this.getProperty(_propertyId);
    return (
      property.getColumnData?.(this.blocks[0].model) ??
      property.columnMeta.model.defaultData()
    );
  }

  public override propertyGetReadonly(propertyId: string): boolean {
    if (propertyId === 'type') return true;
    return this.getProperty(propertyId)?.set == null;
  }

  public propertyGetName(propertyId: string): string {
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
    // TODO
  }

  public override captureSync(): void {}

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
    const block = this.blockMap.get(rowId);
    assertExists(block, `block ${rowId} not found`);
    return this.getProperty(propertyId).updated(block.model, callback);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get addPropertyConfigList(): ColumnConfig<any, any, any>[] {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getPropertyMeta(type: string): ColumnMeta<any, any, any> {
    const meta = this.columnMetaMap.get(type);
    assertExists(meta, `columnMeta ${type} not found`);
    return meta;
  }

  public override get detailSlots(): DetailSlots {
    return {
      ...super.detailSlots,
      header: createUniComponentFromWebComponent(BlockRenderer),
    };
  }

  public rowMove(_rowId: string, _position: InsertToPosition): void {}

  public propertyAdd(
    _insertToPosition: InsertToPosition,
    _type: string | undefined
  ): string {
    throw new Error('Method not implemented.');
  }
}
