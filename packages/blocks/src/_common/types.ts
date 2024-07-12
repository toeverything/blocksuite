import type { Slot } from '@blocksuite/global/utils';
import type { BlockModel, Doc } from '@blocksuite/store';

import type { ConnectorElementModel } from '../surface-block/element-model/connector.js';
import type {
  BrushElementModel,
  GroupElementModel,
} from '../surface-block/index.js';
import type { RefNodeSlots } from './inline/presets/nodes/reference-node/reference-node.js';
import type { BlockComponent } from './utils/query.js';
import type { Point } from './utils/rect.js';

export type SelectionPosition = 'end' | 'start' | Point;

export interface IPoint {
  x: number;
  y: number;
}

export interface EditingState {
  element: BlockComponent;
  model: BlockModel;
  rect: DOMRect;
}

/** Common context interface definition for block models. */

export type CommonSlots = RefNodeSlots;

export type DocMode = 'edgeless' | 'page';

type EditorSlots = {
  docUpdated: Slot<{ newDocId: string }>;
  editorModeSwitched: Slot<DocMode>;
};

export type AbstractEditor = {
  doc: Doc;
  mode: DocMode;
  readonly slots: CommonSlots & EditorSlots;
} & HTMLElement;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtendedModel = BlockModel & Record<string, any>;

export type Connectable = Exclude<
  BlockSuite.EdgelessModelType,
  BrushElementModel | ConnectorElementModel | GroupElementModel
>;

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
  | 'affine:attachment'
  | 'affine:bookmark'
  | 'affine:code'
  | 'affine:data-view'
  | 'affine:database'
  | 'affine:divider'
  | 'affine:image'
  | 'affine:list'
  | 'affine:paragraph'
  | 'affine:surface-ref';

export enum NoteDisplayMode {
  DocAndEdgeless = 'both',
  DocOnly = 'doc',
  EdgelessOnly = 'edgeless',
}

export interface Viewport {
  clientHeight: number;
  clientWidth: number;
  left: number;
  scrollHeight: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  top: number;
}

export type EmbedCardStyle =
  | 'cube'
  | 'cubeThick'
  | 'figma'
  | 'horizontal'
  | 'horizontalThin'
  | 'html'
  | 'list'
  | 'syncedDoc'
  | 'vertical'
  | 'video';
