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
  enable_drag_handle: boolean;
  enable_surface: boolean;
  readonly: Record<string, boolean>;
};

declare namespace BlockSuiteInternal {
  import { TextType } from '@blocksuite/store';
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

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface SurfaceBlockModel {}

  export type ALL = {
    'affine:paragraph': ParagraphBlockModel;
    'affine:page': PageBlockModel;
    'affine:list': ListBlockModel;
    'affine:frame': FrameBlockModel;
    'affine:code': CodeBlockModel;
    'affine:divider': DividerBlockModel;
    'affine:embed': EmbedBlockModel;
    // 'affine:shape': ShapeBlockModel,
    'affine:surface': SurfaceBlockModel;
  };
}
