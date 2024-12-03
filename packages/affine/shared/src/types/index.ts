import type { EmbedCardStyle, ReferenceInfo } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

export interface EditingState {
  element: BlockComponent;
  model: BlockModel;
  rect: DOMRect;
}

export enum LassoMode {
  FreeHand,
  Polygonal,
}

export type NoteChildrenFlavour =
  | 'affine:paragraph'
  | 'affine:list'
  | 'affine:code'
  | 'affine:divider'
  | 'affine:database'
  | 'affine:data-view'
  | 'affine:image'
  | 'affine:bookmark'
  | 'affine:attachment'
  | 'affine:surface-ref';

export interface Viewport {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtendedModel = BlockModel & Record<string, any>;

export type EmbedOptions = {
  flavour: string;
  urlRegex: RegExp;
  styles: EmbedCardStyle[];
  viewType: 'card' | 'embed';
};

export type IndentContext = {
  blockId: string;
  inlineIndex: number;
  flavour: Extract<
    keyof BlockSuite.BlockModels,
    'affine:paragraph' | 'affine:list'
  >;
  type: 'indent' | 'dedent';
};

export interface AffineTextAttributes {
  bold?: true | null;
  italic?: true | null;
  underline?: true | null;
  strike?: true | null;
  code?: true | null;
  link?: string | null;
  reference?:
    | ({
        type: 'Subpage' | 'LinkedPage';
      } & ReferenceInfo)
    | null;
  background?: string | null;
  color?: string | null;
  latex?: string | null;
}
