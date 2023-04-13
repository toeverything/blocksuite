import type { Color, ConnectorMode, ShapeType } from '@blocksuite/phasor';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import type { FrameBlockModel } from '../../frame-block/index.js';
import type {
  BlockServiceInstanceByKey,
  ServiceFlavour,
} from '../../models.js';
import type { Clipboard } from '../clipboard/index.js';
import type { RefNodeSlots } from '../rich-text/reference-node.js';
import type { AffineTextAttributes } from '../rich-text/virgo/types.js';
import type { BlockComponentElement } from './query.js';
import type { Point } from './rect.js';

export type SelectionPosition = 'start' | 'end' | Point;

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

/**
 * @deprecated Not used yet
 */
export interface CommonBlockElement extends HTMLElement {
  host: BlockHost;
  model: BaseBlockModel;
}

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
  fillColor: Color;
  strokeColor: Color;
};

export enum BrushSize {
  Thin = 4,
  Thick = 16,
}

export type BrushMouseMode = {
  type: 'brush';
  color: Color;
  lineWidth: BrushSize;
};

export type PanMouseMode = {
  type: 'pan';
  panning: boolean;
};

export type TextMouseMode = {
  type: 'text';
  background: Color;
};

export type ConnectorMouseMode = {
  type: 'connector';
  mode: ConnectorMode;
  color: Color;
};

export type MouseMode =
  | DefaultMouseMode
  | ShapeMouseMode
  | BrushMouseMode
  | PanMouseMode
  | TextMouseMode
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
    columnIds: string[];
  };
  // frame block
  xywh?: string;
};

declare global {
  interface WindowEventMap {
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
