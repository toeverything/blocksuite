import { assertExists, Slot } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { Page, Workspace } from '@blocksuite/store';

import type { ColumnConfig } from '../../database-block/common/columns/manager.js';
import { multiSelectColumnTypeName } from '../../database-block/common/columns/multi-select/type.js';
import { numberColumnTypeName } from '../../database-block/common/columns/number/type.js';
import { textColumnTypeName } from '../../database-block/common/columns/text/type.js';
import type { InsertPosition } from '../../database-block/index.js';
import type { AllPageDatasourceConfig } from './base.js';
import { BaseDataSource } from './base.js';

export class AllPageDatasource extends BaseDataSource {
  private workspace: Workspace;

  public get rows(): string[] {
    return [...this.workspace.pages.keys()];
  }

  private propertiesMap: Record<
    string,
    {
      type: string;
      getValue: (page: Page) => unknown;
      setValue?: (page: Page, value: unknown) => void;
      getData?: () => Record<string, unknown>;
      changeData?: (data: Record<string, unknown>) => void;
    }
  > = {
    title: {
      type: textColumnTypeName,
      getValue: page => page.meta.title,
      setValue: (page, value) => {
        page.meta.title = `${value ?? ''}`;
      },
    },
    tags: {
      type: multiSelectColumnTypeName,
      getValue: page => page.meta.tags,
      setValue: (page, value) => {
        page.meta.tags = value as string[];
      },
      getData: () => this.workspace.meta.properties.tags,
      changeData: data => {
        this.workspace.meta.setProperties({
          ...this.workspace.meta.properties,
          tags: data as never,
        });
      },
    },
    createDate: {
      type: numberColumnTypeName,
      getValue: page => page.meta.createDate,
    },
  };

  public get properties(): string[] {
    return Object.keys(this.propertiesMap);
  }

  constructor(root: BlockSuiteRoot, config: AllPageDatasourceConfig) {
    super();
    this.workspace = root.page.workspace;
    root.page.workspace.meta.pageMetasUpdated.pipe(this.slots.update);
  }

  public cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    const page = this.workspace.getPage(rowId);
    assertExists(page);
    this.propertiesMap[propertyId]?.setValue?.(page, value);
  }

  public override cellGetRenderValue(
    rowId: string,
    propertyId: string
  ): unknown {
    return this.cellGetValue(rowId, propertyId);
  }

  public cellGetValue(rowId: string, propertyId: string): unknown {
    const page = this.workspace.getPage(rowId);
    assertExists(page);
    return this.propertiesMap[propertyId]?.getValue(page);
  }

  public propertyAdd(insertPosition: InsertPosition): string {
    throw new Error('not support');
  }

  public propertyChangeData(
    propertyId: string,
    data: Record<string, unknown>
  ): void {
    this.propertiesMap[propertyId]?.changeData?.(data);
  }

  public propertyChangeName(propertyId: string, name: string): void {
    // not support
  }

  public propertyChangeType(propertyId: string, type: string): void {
    // not support
  }

  public propertyDelete(id: string): void {
    // not support
  }

  public propertyDuplicate(columnId: string): string {
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

  public rowAdd(insertPosition: InsertPosition): string {
    return this.workspace.createPage().id;
  }

  public rowDelete(ids: string[]): void {
    ids.forEach(id => this.workspace.removePage(id));
  }

  public slots = {
    update: new Slot(),
  };

  public allPropertyConfig: ColumnConfig[] = [];
}
