import { type Slot } from '@blocksuite/global/utils';
import { type BlockModel, type Doc } from '@blocksuite/store';

import type { BookmarkBlockModel } from '../bookmark-block/bookmark-model.js';
import type { EmbedFigmaModel } from '../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../embed-github-block/embed-github-model.js';
import type { EmbedHtmlModel } from '../embed-html-block/embed-html-model.js';
import type { EmbedLinkedDocModel } from '../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedLoomModel } from '../embed-loom-block/embed-loom-model.js';
import type { EmbedSyncedDocModel } from '../embed-synced-doc-block/embed-synced-doc-model.js';
import type { EmbedYoutubeModel } from '../embed-youtube-block/embed-youtube-model.js';
import type { FrameBlockModel } from '../frame-block/frame-model.js';
import type { ImageBlockModel } from '../image-block/image-model.js';
import type { NoteBlockModel } from '../note-block/note-model.js';
import type { EdgelessModel } from '../root-block/edgeless/type.js';
import type {
  ConnectorElementModel,
  ConnectorMode,
} from '../surface-block/element-model/connector.js';
import { type CanvasElement } from '../surface-block/element-model/index.js';
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

export type CellFocus = {
  rowIndex: number;
  columnIndex: number;
};
export type MultiSelection = {
  start: number;
  end: number;
};
export type TableViewSelection = {
  viewId: string;
  type: 'table';
  groupKey?: string;
  rowsSelection?: MultiSelection;
  columnsSelection?: MultiSelection;
  focus: CellFocus;
  isEditing: boolean;
};

type WithKanbanViewType<T> = T extends unknown
  ? {
      viewId: string;
      type: 'kanban';
    } & T
  : never;

export type KanbanCellSelection = {
  selectionType: 'cell';
  groupKey: string;
  cardId: string;
  columnId: string;
  isEditing: boolean;
};
export type KanbanCardSelectionCard = {
  groupKey: string;
  cardId: string;
};
export type KanbanCardSelection = {
  selectionType: 'card';
  cards: [KanbanCardSelectionCard, ...KanbanCardSelectionCard[]];
};
export type KanbanGroupSelection = {
  selectionType: 'group';
  groupKeys: [string, ...string[]];
};
export type KanbanViewSelection =
  | KanbanCellSelection
  | KanbanCardSelection
  | KanbanGroupSelection;
export type KanbanViewSelectionWithType =
  WithKanbanViewType<KanbanViewSelection>;

export type DataViewSelection =
  | TableViewSelection
  | KanbanViewSelectionWithType;
export type GetDataViewSelection<
  K extends DataViewSelection['type'],
  T = DataViewSelection,
> = T extends {
  type: K;
}
  ? T
  : never;
export type DataViewSelectionState = DataViewSelection | undefined;

/** Common context interface definition for block models. */

export type CommonSlots = RefNodeSlots;

type EditorMode = 'page' | 'edgeless';
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

// blocks that would only appear under the edgeless container root
export type TopLevelBlockModel =
  | NoteBlockModel
  | FrameBlockModel
  | ImageBlockModel
  | BookmarkBlockModel
  | EmbedGithubModel
  | EmbedYoutubeModel
  | EmbedFigmaModel
  | EmbedLinkedDocModel
  | EmbedSyncedDocModel
  | EmbedHtmlModel
  | EmbedLoomModel;

export type { EdgelessModel as EdgelessModel };

export type Alignable = EdgelessModel;

export type Selectable = EdgelessModel;

export type Erasable = EdgelessModel;

export type Connectable =
  | TopLevelBlockModel
  | Exclude<
      CanvasElement,
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
  | FrameNavigatorTool;

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
