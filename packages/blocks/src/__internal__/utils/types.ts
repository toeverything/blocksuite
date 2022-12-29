import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { Point } from './rect.js';
import type { GroupBlockModel } from '../../group-block/index.js';
import type { ShapeBlockModel } from '../../shape-block/index.js';
import type { ColorStyle, TDShapeType } from './shape.js';
export type SelectionPosition = 'start' | 'end' | Point;

export type SelectionOptions = {
  needFocus?: boolean;
  from?: 'previous' | 'next';
};

export interface Service {
  isLoaded: boolean;
  load?: () => Promise<unknown>;
}

/** Common context interface definition for block models. */
export interface BlockHost {
  service: (flavour: string) => Service;
  serviceMap: Map<string, Service>;
  page: Page;
  flavour: string;
  readonly: boolean;
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

export interface SelectionInfo {
  type: 'Block' | DomSelectionType;
  selectedBlocks: SelectedBlock[];
}

export interface SelectedBlock {
  id: string;
  startPos?: number;
  endPos?: number;
  children: SelectedBlock[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtendedModel = BaseBlockModel & Record<string, any>;

export interface BlockSelectionInfo {
  type: 'Block';
  blocks: SelectedBlock[];
}

// blocks that would only appear under the edgeless container root
export type RootBlockModel = GroupBlockModel | ShapeBlockModel;

export type DefaultMouseMode = {
  type: 'default';
};

export type ShapeMouseMode = {
  type: 'shape';
  shape: TDShapeType;
  color: ColorStyle | `#${string}`;
};

export type MouseMode = DefaultMouseMode | ShapeMouseMode;

declare global {
  interface WindowEventMap {
    'affine.switch-mouse-mode': CustomEvent<MouseMode>;
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
