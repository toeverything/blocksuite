import { Slot } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { Page, Workspace } from '@blocksuite/store';

import {
  multiSelectHelper,
  numberHelper,
  textHelper,
} from '../../database-block/common/column-manager.js';
import type { InsertPosition } from '../../database-block/index.js';
import type { DataSource } from '../../database-block/table/table-view-manager.js';
import type { AllPageDatasourceConfig } from './datasource-manager.js';

export class AllPageDatasource implements DataSource {
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
      type: textHelper.type,
      getValue: page => page.meta.title,
      setValue: (page, value) => {
        console.log(value);
        page.meta.title = `${value ?? ''}`;
      },
    },
    tags: {
      type: multiSelectHelper.type,
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
      type: numberHelper.type,
      getValue: page => page.meta.createDate,
    },
  };

  public get properties(): string[] {
    return Object.keys(this.propertiesMap);
  }

  constructor(root: BlockSuiteRoot, config: AllPageDatasourceConfig) {
    this.workspace = root.page.workspace;
    root.page.workspace.meta.pageMetasUpdated.pipe(this.slots.update);
  }

  public cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    this.propertiesMap[propertyId]?.setValue?.(
      this.workspace.getPage(rowId)!,
      value
    );
  }

  public cellGetRenderValue(rowId: string, propertyId: string): unknown {
    return this.cellGetValue(rowId, propertyId);
  }

  public cellGetValue(rowId: string, propertyId: string): unknown {
    return this.propertiesMap[propertyId]?.getValue(
      this.workspace.getPage(rowId)!
    );
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
}
