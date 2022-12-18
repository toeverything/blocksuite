import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { Point } from './rect';
import type { GroupBlockModel } from '../../group-block';
import type { ShapeBlockModel } from '../../shape-block';
import type { ColorStyle, TDShapeType } from '@blocksuite/shared/shape';
export type SelectionPosition = 'start' | 'end' | Point;

export type SelectionOptions = {
  needFocus?: boolean;
  from?: 'previous' | 'next';
};

/** Common context interface definition for block models. */
export interface BlockHost {
  page: Page;
  flavour: string;
  readonly: boolean;
}

export interface CommonBlockElement extends HTMLElement {
  host: BlockHost;
  model: BaseBlockModel;
}

export interface SelectionInfo {
  type: string;
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
  color: ColorStyle;
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
