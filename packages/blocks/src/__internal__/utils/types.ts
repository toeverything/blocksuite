import type { ShapeType } from '@blocksuite/phasor';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import type { FrameBlockModel } from '../../frame-block/index.js';
import type { BlockServiceInstance, ServiceFlavour } from '../../models.js';
import type { Clipboard } from '../clipboard/index.js';
import type { AffineTextAttributes } from '../rich-text/virgo/types.js';
import type { Point } from './rect.js';

export type SelectionPosition = 'start' | 'end' | Point;

export interface IService {
  onLoad?: () => Promise<void>;
}

/** Common context interface definition for block models. */

/**
 * Functions that a block host provides
 */
export interface BlockHostContext {
  getService: <Key extends ServiceFlavour>(
    flavour: Key
  ) => BlockServiceInstance[Key];
}

export interface BlockHost extends BlockHostContext {
  page: Page;
  flavour: string;
  clipboard: Clipboard;
}

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
  color: `#${string}`;
};

export type BrushMouseMode = {
  type: 'brush';
  color: `#${string}`;
  lineWidth: number;
};

export type PanMouseMode = {
  type: 'pan';
  panning: boolean;
};

export type TextMouseMode = {
  type: 'text';
};

export type MouseMode =
  | DefaultMouseMode
  | ShapeMouseMode
  | BrushMouseMode
  | PanMouseMode
  | TextMouseMode;

export type OpenBlockInfo = {
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
  children: OpenBlockInfo[];
  sourceId?: string;
  caption?: string;
  width?: number;
  height?: number;
  language?: string;
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
