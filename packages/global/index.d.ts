// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

declare module 'quill' {
  import quill = require('quill/index');
  export type * from 'quill/index' assert { 'resolution-mode': 'require' };
  declare const quillDefault: typeof quill.default;
  export default quillDefault;
}

declare module 'y-protocols/awareness.js' {
  export class Awareness<
    State extends Record<string, unknown> = Record<string, unknown>
  > {
    constructor<
      State extends Record<string, unknown> = Record<string, unknown>
    >(doc: Y.Doc): Awareness<State>;
    clientID: number;
    destroy(): void;
    getStates(): Map<number, State>;
    getLocalState(): State;
    setLocalState(state: State): void;
    setLocalStateField<Field extends keyof State>(
      field: Field,
      value: State[Field]
    ): void;
    on(
      event: 'change',
      callback: (
        diff: {
          added: number[];
          removed: number[];
          updated: number[];
        },
        transactionOrigin: string | number
      ) => void
    ): void;
    on(
      event: 'update',
      callback: (
        diff: {
          added: number[];
          removed: number[];
          updated: number[];
        },
        transactionOrigin: string | number
      ) => void
    ): void;
    on(event: 'destroy', callback: () => void): void;
    off(event: 'change' | 'update' | 'destroy', callback: AnyFunction): void;
  }
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
  enable_block_hub: boolean;
  enable_slash_menu: boolean;
  /**
   * Block selection can trigger format bar
   */
  enable_block_selection_format_bar: boolean;
  enable_edgeless_toolbar: boolean;
  readonly: Record<string, boolean>;
};

declare namespace BlockSuiteInternal {
  import type { Text } from '@blocksuite/store';
  interface IBaseBlockProps {
    flavour: string;
    type?: string;
    id: string;
    children: IBaseBlockProps[];

    // TODO use schema
    text?: Text;
  }

  import type {
    // Model
    CodeBlockModel,
    DatabaseBlockModel,
    DividerBlockModel,
    EmbedBlockModel,
    FrameBlockModel,
    ListBlockModel,
    PageBlockModel,
    ParagraphBlockModel,
    SurfaceBlockModel,
  } from '@blocksuite/blocks/models';

  export type BlockModels = {
    'affine:paragraph': ParagraphBlockModel;
    'affine:page': PageBlockModel;
    'affine:list': ListBlockModel;
    'affine:frame': FrameBlockModel;
    'affine:code': CodeBlockModel;
    'affine:divider': DividerBlockModel;
    'affine:embed': EmbedBlockModel;
    'affine:surface': SurfaceBlockModel;
    'affine:database': DatabaseBlockModel;
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

  interface DatabaseBlockModel {
    columns: BlockSuiteInternal.ColumnTypes[];
    title: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface SurfaceBlockModel {}

  export type ALL = {
    'affine:database': DatabaseBlockModel;
    'affine:paragraph': ParagraphBlockModel;
    'affine:page': PageBlockModel;
    'affine:list': ListBlockModel;
    'affine:frame': FrameBlockModel;
    'affine:code': CodeBlockModel;
    'affine:divider': DividerBlockModel;
    'affine:embed': EmbedBlockModel;
    'affine:surface': SurfaceBlockModel;
  };
}
