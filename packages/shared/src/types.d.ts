import type { Store } from '@blocksuite/store';
import { Point } from './rect';
export type SelectPosition = 'start' | 'end' | Point;
/** Common context interface definition for block models. */
export interface BlockHost {
  store: Store;

  selection: {
    addChangeListener: (
      blockId: string,
      handler: (selected: boolean) => void
    ) => void;
    removeChangeListener: (blockId: string) => void;
    onBlockActive: (
      blockId: string,
      handler: (position: 'start' | 'end' | Point) => void
    ) => void;
    offBlockActive: (blockId: string) => void;
    onBlockActive: (
      blockId: string,
      cb: (position: SelectPosition) => void
    ) => void;
    activePreviousBlock: (blockId: string, position?: SelectPosition) => void;
    activeNextBlock: (blockId: string, position?: SelectPosition) => void;
  };
  hotKeys: {};
}
