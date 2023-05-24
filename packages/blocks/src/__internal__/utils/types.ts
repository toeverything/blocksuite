import type { BlockElement, UIEventDispatcher } from '@blocksuite/lit';
import type { ConnectorMode, ShapeType } from '@blocksuite/phasor';
import {
  type BaseBlockModel,
  DisposableGroup,
  type Page,
  type Slot,
} from '@blocksuite/store';

import type { Cell, Column } from '../../database-block/table/types.js';
import type { FrameBlockModel } from '../../frame-block/index.js';
import type { PageBlockModel } from '../../models.js';
import type {
  BlockServiceInstanceByKey,
  ServiceFlavour,
} from '../../services.js';
import type { Clipboard } from '../clipboard/index.js';
import type { RefNodeSlots } from '../rich-text/reference-node.js';
import type { AffineTextAttributes } from '../rich-text/virgo/types.js';
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

export type DatabaseTableViewRowStateType = 'select' | 'clear' | 'click';
export type DatabaseTableViewRowSelect = {
  type: 'select';
  databaseId: string;
  rowIds: string[];
};
type DatabaseTableViewRowClick = {
  type: 'click';
  databaseId: string;
  rowIds: string[];
};
type DatabaseTableViewRowDelete = {
  type: 'delete';
  databaseId: string;
  rowIds: string[];
};
type DatabaseTableViewRowClear = {
  type: 'clear';
};
export type DatabaseTableViewRowState =
  | DatabaseTableViewRowSelect
  | DatabaseTableViewRowClick
  | DatabaseTableViewRowDelete
  | DatabaseTableViewRowClear;

export type CellCoord = {
  rowIndex: number;
  cellIndex: number;
};
export type DatabaseTableViewCellSelect = {
  type: 'select';
  databaseId: string;
  // Currently only supports single cell selection.
  coords: [CellCoord];
};
type DatabaseTableViewCellEdit = {
  type: 'edit';
  databaseId: string;
  coords: [CellCoord];
};
type DatabaseTableViewCellClear = {
  type: 'clear';
};
export type DatabaseTableViewCellState =
  | DatabaseTableViewCellSelect
  | DatabaseTableViewCellEdit
  | DatabaseTableViewCellClear;

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
type EditorSlots = { pageModeSwitched: Slot<EditorMode> };

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
export type TopLevelBlockModel = FrameBlockModel;

export type DefaultMouseMode = {
  type: 'default';
};

export type ShapeMouseMode = {
  type: 'shape';
  shape: ShapeType | 'roundedRect';
  fillColor: CssVariableName;
  strokeColor: CssVariableName;
};

export enum BrushSize {
  Thin = 4,
  Thick = 10,
}

export type TextMouseMode = {
  type: 'text';
};

export type BrushMouseMode = {
  type: 'brush';
  color: CssVariableName;
  lineWidth: BrushSize;
};

export type PanMouseMode = {
  type: 'pan';
  panning: boolean;
};

export type NoteMouseMode = {
  type: 'note';
  background: CssVariableName;
};

export type ConnectorMouseMode = {
  type: 'connector';
  mode: ConnectorMode;
  color: CssVariableName;
};

export type MouseMode =
  | DefaultMouseMode
  | TextMouseMode
  | ShapeMouseMode
  | BrushMouseMode
  | PanMouseMode
  | NoteMouseMode
  | ConnectorMouseMode;

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
    titleColumnName: string;
    titleColumnWidth: number;
    rowIds: string[];
    cells: Record<string, Record<string, Cell>>;
    columns: Column[];
  };
  // frame block
  xywh?: string;
};

export type EmbedBlockDoubleClickData = {
  blockId: string;
};

declare global {
  interface WindowEventMap {
    'affine.embed-block-db-click': CustomEvent<EmbedBlockDoubleClickData>;
    'affine.switch-mouse-mode': CustomEvent<MouseMode>;
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

export abstract class AbstractSelectionManager<
  T extends BlockElement<PageBlockModel>
> {
  public readonly container: T;
  protected readonly _dispatcher: UIEventDispatcher;
  protected readonly _disposables = new DisposableGroup();

  constructor(container: T, dispatcher: UIEventDispatcher) {
    this.container = container;
    this._dispatcher = dispatcher;
  }

  protected get page() {
    return this.container.page;
  }

  abstract clear(): void;

  abstract dispose(): void;
}
