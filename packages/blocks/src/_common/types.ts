import { type Slot } from '@blocksuite/global/utils';
import { type BlockModel, type Doc } from '@blocksuite/store';

import type {
  ConnectorElementModel,
  ConnectorMode,
} from '../surface-block/element-model/connector.js';
import type {
  BrushElementModel,
  GroupElementModel,
  ShapeType,
} from '../surface-block/index.js';
import type { NavigatorMode } from './edgeless/frame/consts.js';
import type { RefNodeSlots } from './inline/presets/nodes/reference-node/reference-node.js';
import type { BlockComponent } from './utils/query.js';
import type { Point } from './utils/rect.js';

export type SelectionPosition = 'start' | 'end' | Point;

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

export type EditorMode = 'page' | 'edgeless';
type EditorSlots = {
  editorModeSwitched: Slot<EditorMode>;
  docUpdated: Slot<{ newDocId: string }>;
};

export type AbstractEditor = {
  doc: Doc;
  mode: EditorMode;
  readonly slots: CommonSlots & EditorSlots;
} & HTMLElement;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtendedModel = BlockModel & Record<string, any>;

export type Connectable = Exclude<
  BlockSuite.EdgelessModelType,
  ConnectorElementModel | BrushElementModel | GroupElementModel
>;

export type DefaultTool = {
  type: 'default';
};

export type ShapeTool = {
  type: 'shape';
  shapeType: ShapeType | 'roundedRect';
};

export enum LineWidth {
  Two = 2,
  // Thin
  Four = 4,
  Six = 6,
  Eight = 8,
  // Thick
  Ten = 10,
  Twelve = 12,
}

export enum LassoMode {
  FreeHand,
  Polygonal,
}

export type TextTool = {
  type: 'text';
};

export type BrushTool = {
  type: 'brush';
};

export type EraserTool = {
  type: 'eraser';
};

export type FrameTool = {
  type: 'frame';
};

export type FrameNavigatorTool = {
  type: 'frameNavigator';
  mode?: NavigatorMode;
};

export type PanTool = {
  type: 'pan';
  panning: boolean;
};

export type CopilotSelectionTool = {
  type: 'copilot';
};

export type LassoTool = {
  type: 'lasso';
  mode: LassoMode;
};

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

export type NoteTool = {
  type: 'affine:note';
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
  tip: string;
};

export enum NoteDisplayMode {
  DocAndEdgeless = 'both',
  EdgelessOnly = 'edgeless',
  DocOnly = 'doc',
}

export type ConnectorTool = {
  type: 'connector';
  mode: ConnectorMode;
};

export type EdgelessTool =
  | DefaultTool
  | TextTool
  | ShapeTool
  | BrushTool
  | PanTool
  | NoteTool
  | ConnectorTool
  | EraserTool
  | FrameTool
  | FrameNavigatorTool
  | CopilotSelectionTool
  | LassoTool;

export type EmbedBlockDoubleClickData = {
  blockId: string;
};

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

export type EmbedCardStyle =
  | 'horizontal'
  | 'horizontalThin'
  | 'list'
  | 'vertical'
  | 'cube'
  | 'cubeThick'
  | 'video'
  | 'figma'
  | 'html'
  | 'syncedDoc';
