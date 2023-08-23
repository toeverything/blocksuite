import { type Slot } from '@blocksuite/global/utils';
import type {
  BrushElement,
  ConnectorElement,
  ConnectorMode,
  PhasorElement,
  ShapeStyle,
  ShapeType,
} from '@blocksuite/phasor';
import { type BaseBlockModel, type Page } from '@blocksuite/store';

import type { DataViewDataType } from '../../database-block/common/data-view.js';
import type { Cell } from '../../database-block/index.js';
import type { Column } from '../../database-block/table/types.js';
import type { NoteBlockModel } from '../../note-block/index.js';
import type { Clipboard } from '../clipboard/index.js';
import type { RefNodeSlots } from '../rich-text/reference-node.js';
import type { AffineTextAttributes } from '../rich-text/virgo/types.js';
import type {
  BlockServiceInstanceByKey,
  ServiceFlavour,
} from '../service/legacy-services/index.js';
import type { CssVariableName } from '../theme/css-variables.js';
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
  rowsSelection?: MultiSelection;
  columnsSelection?: MultiSelection;
  focus: CellFocus;
  isEditing: boolean;
};

export type KanbanFocusData = {
  columnId: string;
  isEditing: boolean;
};

export type KanbanViewSelection = {
  viewId: string;
  type: 'kanban';
  groupKey: string;
  cardId: string;
  focus?: KanbanFocusData;
};

export type DataViewSelection = TableViewSelection | KanbanViewSelection;
export type GetDataViewSelection<
  K extends DataViewSelection['type'],
  T = DataViewSelection
> = T extends {
  type: K;
}
  ? T
  : never;
export type DataViewSelectionState = DataViewSelection | undefined;

/** Common context interface definition for block models. */

/**
 * Functions that a block host provides
 */
export interface BlockHostContext {
  getService: <Key extends ServiceFlavour>(
    flavour: Key
  ) => BlockServiceInstanceByKey<Key>;
}

export type CommonSlots = RefNodeSlots;

export interface BlockHost extends BlockHostContext {
  page: Page;
  flavour: string;
  clipboard: Clipboard;
  readonly slots: CommonSlots;
}

type EditorMode = 'page' | 'edgeless';
type EditorSlots = {
  pageModeSwitched: Slot<EditorMode>;
};

export type AbstractEditor = {
  page: Page;
  mode: EditorMode;
  readonly slots: CommonSlots & EditorSlots;
} & HTMLElement;

/**
 * type of `window.getSelection().type`
 *
 * The attribute must return "None" if this is empty, "Caret" if this's range is collapsed, and "Range" otherwise.
 *
 * More details see https://w3c.github.io/selection-api/#dom-selection-type
 */
export type DomSelectionType = 'Caret' | 'Range' | 'None';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtendedModel = BaseBlockModel & Record<string, any>;

// blocks that would only appear under the edgeless container root
export type TopLevelBlockModel = NoteBlockModel;

export type EdgelessElement = TopLevelBlockModel | PhasorElement;

export type Alignable = EdgelessElement;

export type Erasable = EdgelessElement;

export type Connectable =
  | NoteBlockModel
  | Exclude<PhasorElement, ConnectorElement | BrushElement>;

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

export enum LineWidth {
  LINE_WIDTH_TWO = 2,
  LINE_WIDTH_FOUR = 4,
  LINE_WIDTH_SIX = 6,
  LINE_WIDTH_EIGHT = 8,
  LINE_WIDTH_TEN = 10,
  LINE_WIDTH_TWELVE = 12,
  Thin = 4,
  Thick = 10,
}

export type TextTool = {
  type: 'text';
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

export type SerializedBlock = {
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
  title?: string;
  description?: string;
  icon?: string;
  image?: string;
  url?: string;
  crawled?: boolean;
  background?: string;
  bookmarkTitle?: string;
};

export type EmbedBlockDoubleClickData = {
  blockId: string;
};

declare global {
  interface WindowEventMap {
    'affine.embed-block-db-click': CustomEvent<EmbedBlockDoubleClickData>;
    'affine.switch-mouse-mode': CustomEvent<EdgelessTool>;
    'affine:switch-edgeless-display-mode': CustomEvent<boolean>;
  }
}

type WindowEventDetail<T extends keyof WindowEventMap> =
  WindowEventMap[T] extends {
    detail: unknown;
  }
    ? WindowEventMap[T]['detail']
    : unknown;

type HTMLElementEventDetail<T extends keyof HTMLElementEventMap> =
  HTMLElementEventMap[T] extends {
    detail: unknown;
  }
    ? HTMLElementEventMap[T]['detail']
    : unknown;

export type Detail<T extends keyof WindowEventMap | keyof HTMLElementEventMap> =
  T extends keyof WindowEventMap
    ? WindowEventDetail<T>
    : T extends keyof HTMLElementEventMap
    ? HTMLElementEventDetail<T>
    : never;
