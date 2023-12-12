import { type Slot } from '@blocksuite/global/utils';
import { type BaseBlockModel, type Page } from '@blocksuite/store';

import type { RefNodeSlots } from '../../_common/components/rich-text/virgo/nodes/reference-node.js';
import type { AffineTextAttributes } from '../../_common/components/rich-text/virgo/types.js';
import type { CssVariableName } from '../../_common/theme/css-variables.js';
import type { ServiceFlavour } from '../../_legacy/service/legacy-services/index.js';
import type { DataViewDataType } from '../../database-block/common/data-view.js';
import type { Cell } from '../../database-block/index.js';
import type { Column } from '../../database-block/table/types.js';
import type { FrameBlockModel } from '../../frame-block/index.js';
import type { ImageBlockModel } from '../../image-block/index.js';
import type { BookmarkBlockModel } from '../../models.js';
import type { NoteBlockModel } from '../../note-block/index.js';
import { type ShapeStyle } from '../../surface-block/consts.js';
import {
  type BrushElement,
  type CanvasElement,
  type ConnectorElement,
  type ConnectorMode,
  type GroupElement,
  type ShapeType,
} from '../../surface-block/elements/index.js';
import type { NavigatorMode } from '../edgeless/frame/consts.js';
import type { BlockComponentElement } from './query.js';
import type { Point } from './rect.js';

export type SelectionPosition = 'start' | 'end' | Point;

export interface IPoint {
  x: number;
  y: number;
}

export interface BlockTransformContext {
  childText?: string;
  begin?: number;
  end?: number;
}

export interface EditingState {
  element: BlockComponentElement;
  model: BaseBlockModel;
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
  pageModeSwitched: Slot<EditorMode>;
  pageUpdated: Slot<{ newPageId: string }>;
};

export type AbstractEditor = {
  page: Page;
  mode: EditorMode;
  readonly slots: CommonSlots & EditorSlots;
} & HTMLElement;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtendedModel = BaseBlockModel & Record<string, any>;

// blocks that would only appear under the edgeless container root
export type TopLevelBlockModel =
  | NoteBlockModel
  | FrameBlockModel
  | ImageBlockModel
  | BookmarkBlockModel;

export type EdgelessElement = TopLevelBlockModel | CanvasElement;

export type Alignable = EdgelessElement;

export type Selectable = EdgelessElement;

export type Erasable = EdgelessElement;

export type Connectable =
  | TopLevelBlockModel
  | Exclude<CanvasElement, ConnectorElement | BrushElement | GroupElement>;

export type DefaultTool = {
  type: 'default';
};

export type ShapeTool = {
  type: 'shape';
  shape: ShapeType | 'roundedRect';
  fillColor: CssVariableName;
  strokeColor: CssVariableName;
  shapeStyle: ShapeStyle;
};

export type ShapeToolState = {
  shape: ShapeType | 'roundedRect';
  fillColor: string;
  strokeColor: string;
  shapeStyle: ShapeStyle;
};

export enum LineWidth {
  LINE_WIDTH_TWO = 2,
  LINE_WIDTH_FOUR = 4,
  LINE_WIDTH_SIX = 6,
  LINE_WIDTH_EIGHT = 8,
  LINE_WIDTH_TEN = 10,
  LINE_WIDTH_TWELVE = 12,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  Thin = 4,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  Thick = 10,
}

export type TextTool = {
  type: 'text';
  color: CssVariableName;
};

export type BrushTool = {
  type: 'brush';
  color: CssVariableName;
  lineWidth: LineWidth;
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

export type NoteChildrenFlavour = ServiceFlavour;

export type NoteTool = {
  type: 'note';
  background: CssVariableName;
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
  tip: string;
};

export type ConnectorTool = {
  type: 'connector';
  mode: ConnectorMode;
  color: CssVariableName;
  strokeWidth: LineWidth;
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

/** @deprecated */
export type SerializedBlock = {
  id?: string;
  flavour: string;
  type?: string;
  text?: {
    insert?: string;
    delete?: number;
    retain?: number;
    attributes?: AffineTextAttributes;
  }[];
  rawText?: {
    insert: string;
    delete?: number;
    retain?: number;
  }[];
  checked?: boolean;
  children: SerializedBlock[];
  sourceId?: string;
  caption?: string;
  name?: string;
  size?: number;
  width?: number;
  height?: number;
  language?: string;
  databaseProps?: {
    id: string;
    title: string;
    rowIds: string[];
    cells: Record<string, Record<string, Cell>>;
    columns: Column[];
    views?: DataViewDataType[];
  };
  // note block
  xywh?: string;
  // bookmark block
  style?: string;
  title?: string;
  description?: string;
  icon?: string;
  image?: string;
  url?: string;
  crawled?: boolean;
  background?: string;
  rotate?: number;
  hidden?: boolean;
  edgeless?: Record<string, Record<string, unknown> | unknown>;
};

export type EmbedBlockDoubleClickData = {
  blockId: string;
};
