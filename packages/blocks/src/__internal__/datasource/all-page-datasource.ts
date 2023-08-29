import { assertExists, Slot } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { Page, Workspace } from '@blocksuite/store';

import type { ColumnConfig } from '../../database-block/common/columns/manager.js';
import { multiSelectPureColumnConfig } from '../../database-block/common/columns/multi-select/define.js';
import { numberPureColumnConfig } from '../../database-block/common/columns/number/define.js';
import { textPureColumnConfig } from '../../database-block/common/columns/text/define.js';
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
      type: textPureColumnConfig.type,
      getValue: page => page.meta.title,
      setValue: (page, value) => {
        page.meta.title = `${value ?? ''}`;
      },
    },
    tags: {
      type: multiSelectPureColumnConfig.type,
      getValue: page => page.meta.tags,
      setValue: (page, value) => {
        page.meta.tags = value as string[];
      },
      getData: () => ({
        options: this.workspace.meta.properties.tags?.options ?? [],
      }),
      changeData: data => {
        this.workspace.meta.setProperties({
          ...this.workspace.meta.properties,
          tags: data as never,
        });
      },
    },
    createDate: {
      type: numberPureColumnConfig.type,
      getValue: page => page.meta.createDate,
    },
  };

  public get properties(): string[] {
    return Object.keys(this.propertiesMap);
  }

  constructor(root: BlockSuiteRoot, _config: AllPageDatasourceConfig) {
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

  public propertyAdd(_insertPosition: InsertPosition | number): string {
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

  public rowAdd(_insertPosition: InsertPosition | number): string {
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
