import { type EditorHost } from '@blocksuite/block-std';
import { assertExists, Slot } from '@blocksuite/global/utils';
import { type DocCollection, nanoid } from '@blocksuite/store';

import type { ColumnMeta } from '../../column/column-config.js';
import { type ColumnConfig } from '../../column/index.js';
import { selectColumnModelConfig } from '../../column/presets/select/define.js';
import { textColumnModelConfig } from '../../column/presets/text/define.js';
import type { InsertToPosition } from '../../types.js';
import { getTagColor, selectOptionColors } from '../../utils/tags/colors.js';
import type { SelectTag } from '../../utils/tags/multi-tag-select.js';
import type { StatCalcOpType } from '../../views/table/types.js';
import { BaseDataSource, type TagsDataSourceConfig } from './base.js';

export class TagsDataSource extends BaseDataSource {
  private meta: DocCollection['meta'];

  public rowMove(rowId: string, position: InsertToPosition): void {
    // not support
    rowId;
    position;
  }

  public get rows(): string[] {
    return this.tags.map(v => v.id);
  }

  private propertiesMap: Record<
    string,
    {
      type: string;
      getValue: (tag: SelectTag) => unknown;
      setValue?: (tag: SelectTag, value: unknown) => void;
      getData?: () => Record<string, unknown>;
      changeData?: (data: Record<string, unknown>) => void;
    }
  > = {
    value: {
      type: textColumnModelConfig.type,
      getValue: tag => tag.value,
      setValue: (tag, value) => {
        this.changeTag({
          ...tag,
          value: `${value ?? ''}`,
        });
      },
    },
    color: {
      type: selectColumnModelConfig.type,
      getValue: tag => tag.color,
      setValue: (tag, value) => {
        this.changeTag({
          ...tag,
          color: `${value ?? ''}`,
        });
      },
      getData: () => ({
        options: selectOptionColors.map(v => ({
          id: v.color,
          value: v.name,
          color: v.color,
        })),
      }),
    },
    parent: {
      type: selectColumnModelConfig.type,
      getData: () => ({ options: this.meta.properties.tags?.options ?? [] }),
      getValue: tag => tag.parentId,
      setValue: (tag, value) => {
        this.changeTag({
          ...tag,
          parentId: `${value ?? ''}`,
        });
      },
    },
  };

  public get properties(): string[] {
    return Object.keys(this.propertiesMap);
  }

  constructor(host: EditorHost, _config: TagsDataSourceConfig) {
    super();
    this.meta = host.doc.collection.meta;
    host.doc.collection.meta.docMetaUpdated.pipe(this.slots.update);
  }

  public cellChangeValue(
    rowId: string,
    propertyId: string,
    value: unknown
  ): void {
    const tag = this.tags.find(v => v.id === rowId);
    if (tag) {
      this.propertiesMap[propertyId]?.setValue?.(tag, value);
    }
  }

  public override cellGetRenderValue(
    rowId: string,
    propertyId: string
  ): unknown {
    return this.cellGetValue(rowId, propertyId);
  }

  public cellGetValue(rowId: string, propertyId: string): unknown {
    const tag = this.tags.find(v => v.id === rowId);
    assertExists(tag);
    return this.propertiesMap[propertyId]?.getValue(tag);
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

  public propertyChangeStatCalcOp(
    _propertyId: string,
    _type: StatCalcOpType
  ): void {
    // no support
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

  public override propertyGetStatCalcOp(_propertyId: string): StatCalcOpType {
    return 'none';
  }

  public propertyGetType(propertyId: string): string {
    return this.propertiesMap[propertyId].type;
  }

  public rowAdd(_insertPosition: InsertToPosition | number): string {
    const id = nanoid();
    this.changeTags([
      ...this.tags,
      {
        id,
        value: '',
        color: getTagColor(),
      },
    ]);
    return id;
  }

  public rowDelete(ids: string[]): void {
    this.changeTags(this.tags.filter(v => !ids.includes(v.id)));
  }

  public slots = {
    update: new Slot(),
  };

  private get tags() {
    return this.meta.properties.tags?.options ?? [];
  }

  private changeTags = (tags: SelectTag[]) => {
    this.meta.setProperties({
      ...this.meta.properties,
      tags: { options: tags },
    });
  };
  private changeTag = (tag: SelectTag) => {
    this.changeTags(this.tags.map(v => (v.id === tag.id ? tag : v)));
  };
  public allPropertyConfig: ColumnConfig[] = [];

  public getPropertyMeta(_type: string): ColumnMeta {
    throw new Error('not support');
  }
}
