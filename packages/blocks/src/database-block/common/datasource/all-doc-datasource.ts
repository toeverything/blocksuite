import type { EditorHost } from '@blocksuite/block-std';
import { assertExists, Slot } from '@blocksuite/global/utils';
import type { Doc, DocCollection } from '@blocksuite/store';

import type { InsertToPosition } from '../../types.js';
import type { ColumnConfig } from '../columns/manager.js';
import { multiSelectPureColumnConfig } from '../columns/multi-select/define.js';
import { numberPureColumnConfig } from '../columns/number/define.js';
import { textPureColumnConfig } from '../columns/text/define.js';
import type { AllDocDatasourceConfig } from './base.js';
import { BaseDataSource } from './base.js';

export class AllDocDatasource extends BaseDataSource {
  private collection: DocCollection;

  public get rows(): string[] {
    return Array.from(this.collection.docs.keys());
  }

  private propertiesMap: Record<
    string,
    {
      type: string;
      getValue: (doc: Doc) => unknown;
      setValue?: (doc: Doc, value: unknown) => void;
      getData?: () => Record<string, unknown>;
      changeData?: (data: Record<string, unknown>) => void;
    }
  > = {
    title: {
      type: textPureColumnConfig.type,
      getValue: doc => doc.meta?.title,
      setValue: (doc, value) => {
        assertExists(doc.meta);
        doc.meta.title = `${value ?? ''}`;
      },
    },
    tags: {
      type: multiSelectPureColumnConfig.type,
      getValue: doc => doc.meta?.tags,
      setValue: (doc, value) => {
        assertExists(doc.meta);
        doc.meta.tags = value as string[];
      },
      getData: () => ({
        options: this.collection.meta.properties.tags?.options ?? [],
      }),
      changeData: data => {
        this.collection.meta.setProperties({
          ...this.collection.meta.properties,
          tags: data as never,
        });
      },
    },
    createDate: {
      type: numberPureColumnConfig.type,
      getValue: doc => doc.meta?.createDate,
    },
  };

  public get properties(): string[] {
    return Object.keys(this.propertiesMap);
  }

  constructor(host: EditorHost, _config: AllDocDatasourceConfig) {
    super();
    this.collection = host.doc.collection;
    host.doc.collection.meta.docMetaUpdated.pipe(this.slots.update);
  }

  public cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    const doc = this.collection.getDoc(rowId);
    assertExists(doc);
    this.propertiesMap[propertyId]?.setValue?.(doc, value);
  }

  public override cellGetRenderValue(
    rowId: string,
    propertyId: string
  ): unknown {
    return this.cellGetValue(rowId, propertyId);
  }

  public cellGetValue(rowId: string, propertyId: string): unknown {
    const doc = this.collection.getDoc(rowId);
    assertExists(doc);
    return this.propertiesMap[propertyId]?.getValue(doc);
  }

  public propertyAdd(_insertPosition: InsertToPosition | number): string {
    throw new Error('not support');
  }

  public propertyChangeData(
    propertyId: string,
    data: Record<string, unknown>
  ): void {
    this.propertiesMap[propertyId]?.changeData?.(data);
  }

  public propertyChangeName(_propertyId: string, _name: string): void {
    // not support
  }

  public propertyChangeType(_propertyId: string, _type: string): void {
    // not support
  }

  public propertyDelete(_id: string): void {
    // not support
  }

  public propertyDuplicate(_columnId: string): string {
    throw new Error('not support');
  }

  public propertyGetData(propertyId: string): Record<string, unknown> {
    return this.propertiesMap[propertyId]?.getData?.() ?? {};
  }

  public propertyGetName(propertyId: string): string {
    return propertyId;
  }

  public propertyGetType(propertyId: string): string {
    return this.propertiesMap[propertyId].type;
  }

  public rowAdd(_insertPosition: InsertToPosition | number): string {
    return this.collection.createDoc().id;
  }

  public rowDelete(ids: string[]): void {
    ids.forEach(id => this.collection.removeDoc(id));
  }

  public slots = {
    update: new Slot(),
  };

  public allPropertyConfig: ColumnConfig[] = [];

  public rowMove(rowId: string, position: InsertToPosition): void {
    // not support
    rowId;
    position;
  }
}
