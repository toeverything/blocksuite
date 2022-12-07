import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { Point } from './rect';

export type SelectionPosition = 'start' | 'end' | Point;

export type SelectionOptions = {
  needFocus?: boolean;
  from?: 'previous' | 'next';
};

/** Common context interface definition for block models. */
export interface BlockHost {
  page: Page;
  flavour: string;
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

export type MouseMode = 'default' | 'shape';

declare global {
  interface WindowEventMap {
    'affine.switch-mode': CustomEvent<'page' | 'edgeless'>;
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
