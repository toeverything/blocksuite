import type { Slot } from '@blocksuite/store';
import { createContext } from '@lit/context';

export interface EdgelessToolbarSlots {
  resize: Slot<{ w: number; h: number }>;
}

export const edgelessToolbarSlotsContext = createContext<EdgelessToolbarSlots>(
  Symbol('edgelessToolbarSlotsContext')
);

export const edgelessToolbarThemeContext = createContext<'light' | 'dark'>(
  Symbol('edgelessToolbarThemeContext')
);
