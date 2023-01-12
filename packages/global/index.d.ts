declare module 'quill' {
  import quill = require('quill/index');
  export type * from 'quill/index' assert { 'resolution-mode': 'require' };
  declare const quillDefault: typeof quill.default;
  export default quillDefault;
}

// eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword
declare module NodeJS {
  interface ProcessEnv {
    readonly CI: string;
    readonly NODE_ENV: 'development' | 'production';
    readonly engine: 'chromium' | 'firefox' | 'safari';
  }
}

declare type PropsWithId<Props> = Props & { id: string };

declare type BlockSuiteFlags = {
  enable_set_remote_flag: boolean;
  enable_database: boolean;
  enable_drag_handle: boolean;
  enable_surface: boolean;
  readonly: Record<string, boolean>;
};

declare namespace BlockSuiteInternal {
  import { TextType } from '@blocksuite/store';
  /**
   *  Block | Col 1 | Col 2 | Col 3
   *  Paragraph | hello | 1 | true
   *  Block | good | 114514 | false
   */

  interface TagTypeMetadata {
    /**
     * color of the tag
     */
    color: `#${string}`;
    /**
     * width of a column
     */
    width: number; // px
    /**
     * whether this display in the table
     */
    hide: boolean;
  }

  // Threat this type as a column type
  interface BaseTagType<BaseValue = unknown> {
    /**
     * each instance of tag type has its own unique uuid
     */
    id: string;
    type: string;
    /**
     * column name
     */
    name: string;
    metadata: TagTypeMetadata;
    /**
     * this value is just for hold the `BaseValue`,
     *  don't use this value in the runtime.
     */
    __$TYPE_HOLDER$__?: BaseValue;
  }

  interface TextTagType extends BaseTagType<string> {
    type: 'affine-tag:text';
  }

  interface NumberTagType extends BaseTagType<number> {
    type: 'affine-tag:number';
    decimal: number;
  }

  interface SelectTagType<Selection extends string = string>
    extends BaseTagType<string> {
    type: 'affine-tag:select';
    selection: Selection[];
  }

  type TagTypes = SelectTagType | NumberTagType | TextTagType;

  interface BlockColumnType extends BaseTagType {
    type: 'affine-column:single-text';
    // no value here, the value depends on the row block
  }

  type ColumnTypes = TagTypes | BlockColumnType;

  // threat this type as row type
  interface BlockTag<Type extends TagTypes = TagTypes> {
    type: Type['id'];
    value: Type extends BaseTagType<infer U>
      ? U
      : Type extends BlockColumnType
      ? undefined
      : never;
  }

  interface IBaseBlockProps {
    flavour: string;
    type: string;
    id: string;
    children: IBaseBlockProps[];

    // TODO use schema
    text?: TextType;
  }

  import {
    // Model
    CodeBlockModel,
    DividerBlockModel,
    EmbedBlockModel,
    FrameBlockModel,
    ListBlockModel,
    PageBlockModel,
    ParagraphBlockModel,
    SurfaceBlockModel,
    DatabaseBlockModel,
    RowBlockModel,
  } from '@blocksuite/blocks';

  export type BlockModels = {
    'affine:paragraph': ParagraphBlockModel;
    'affine:page': PageBlockModel;
    'affine:list': ListBlockModel;
    'affine:frame': FrameBlockModel;
    'affine:code': CodeBlockModel;
    'affine:divider': DividerBlockModel;
    'affine:embed': EmbedBlockModel;
    // 'affine:shape': ShapeBlockModel,
    'affine:surface': SurfaceBlockModel;
    'affine:database': DatabaseBlockModel;
    'affine:row': RowBlockModel;
  };
}

declare type EmbedType = 'image' | 'video' | 'audio' | 'file';
declare type ListType = 'bulleted' | 'numbered' | 'todo';
declare type ParagraphType =
  | 'text'
  | 'quote'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6';

declare namespace BlockSuiteModelProps {
  interface CodeBlockModel {
    language: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DividerBlockModel {}

  interface EmbedBlockModel {
    type: EmbedType;
    sourceId: string;
    width?: number;
    height?: number;
    caption?: string;
  }

  interface FrameBlockModel {
    xywh: string;
  }

  interface ListBlockModel {
    type: ListType;
    checked: boolean;
  }

  interface PageBlockModel {
    title: string;
  }

  interface ParagraphBlockModel {
    type: ParagraphType;
  }

  import type { ColorStyle, TDShapeType } from '@blocksuite/blocks';
  interface ShapeBlockModel {
    color: ColorStyle | `#${string}`;
    type: TDShapeType;

    xywh: string;
  }

  interface DatabaseBlockModel {
    columns: BlockSuiteInternal.ColumnTypes[];
    title: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface SurfaceBlockModel {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface RowBlockModel {}

  export type ALL = {
    'affine:database': DatabaseBlockModel;
    'affine:paragraph': ParagraphBlockModel;
    'affine:page': PageBlockModel;
    'affine:list': ListBlockModel;
    'affine:frame': FrameBlockModel;
    'affine:code': CodeBlockModel;
    'affine:divider': DividerBlockModel;
    'affine:embed': EmbedBlockModel;
    // 'affine:shape': ShapeBlockModel,
    'affine:surface': SurfaceBlockModel;
    'affine:row': RowBlockModel;
  };
}
