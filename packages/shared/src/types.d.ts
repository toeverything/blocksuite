import type { Store } from '@blocksuite/store';
import { Point } from './rect';

export type SelectionPosition = 'start' | 'end' | Point;

/** Common context interface definition for block models. */
export interface BlockHost {
  store: Store;

  selection: {
    addBlockSelectedListener: (
      blockId: string,
      handler: (selected: boolean) => void
    ) => void;
    removeBlockSelectedListener: (blockId: string) => void;

    addBlockActiveListener: (
      blockId: string,
      handler: (position: SelectionPosition) => void
    ) => void;
    removeBlockActiveListener: (blockId: string) => void;

    activePreviousBlock: (
      blockId: string,
      position?: SelectionPosition
    ) => void;
    activeNextBlock: (blockId: string, position?: SelectionPosition) => void;
  };
}
