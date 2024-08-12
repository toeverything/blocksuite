import type { EmbedCardStyle } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import type { Point } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

export interface EditingState {
  element: BlockComponent;
  model: BlockModel;
  rect: DOMRect;
}

export type SelectionPosition = 'start' | 'end' | Point;

export enum LineWidth {
  Eight = 8,
  // Thin
  Four = 4,
  Six = 6,
  // Thick
  Ten = 10,
  Twelve = 12,
  Two = 2,
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
