import type { BaseBlockModel, Store } from '@blocksuite/store';
import { Point } from './rect';

export type SelectionPosition = 'start' | 'end' | Point;

export type SelectionOptions = {
  needFocus?: boolean;
  from?: 'previous' | 'next';
};

/** Common context interface definition for block models. */
export interface BlockHost {
  store: Store;

  selection: {
    addBlockSelectedListener: (
      blockId: string,
      handler: (selectionInfo?: SelectionOptions) => void
    ) => void;
    removeBlockSelectedListener: (blockId: string) => void;
    activatePreviousBlock: (
      blockId: string,
      position?: SelectionPosition
    ) => void;
    activateNextBlock: (blockId: string, position?: SelectionPosition) => void;
    selectAllBlocks: () => void;
    selectionInfo: SelectionInfo;
    lastSelectionPosition: SelectionPosition;
  };
}

export interface CommonBlockElement extends HTMLElement {
  host: BlockHost;
  model: BaseBlockModel;
}

export interface SelectedBlock {
  id: string;
  startPos?: number;
  endPos?: number;
  children: SelectedBlock[];
}

interface NoneSelectionInfo {
  type: 'None';
}

interface CaretSelectionInfo {
  type: 'Caret';
  anchorBlockId: string;
  focusBlockId: string;
  anchorBlockPosition: number | null;
  focusBlockPosition: number | null;
}

interface RangeSelectionInfo {
  type: 'Range';
  anchorBlockId: string;
  focusBlockId: string;
  anchorBlockPosition: number | null;
  focusBlockPosition: number | null;
}

export interface BlockSelectionInfo {
  type: 'Block';
  blocks: SelectedBlock[];
}

export type SelectionInfo =
  | NoneSelectionInfo
  | CaretSelectionInfo
  | RangeSelectionInfo
  | BlockSelectionInfo;

declare global {
  interface WindowEventMap {
    'affine.switch-mode': CustomEvent<'page' | 'edgeless'>;
  }
}

export type Detail<T extends keyof WindowEventMap> = WindowEventMap[T] extends {
  detail: unknown;
}
  ? WindowEventMap[T]['detail']
  : unknown;
