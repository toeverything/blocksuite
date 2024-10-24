import type { ColorScheme } from '@blocksuite/affine-model';
import type { Slot } from '@blocksuite/store';

import { createContext } from '@lit/context';

import type { EdgelessToolbarWidget } from './edgeless-toolbar.js';

export interface EdgelessToolbarSlots {
  resize: Slot<{ w: number; h: number }>;
}

export const edgelessToolbarSlotsContext = createContext<EdgelessToolbarSlots>(
  Symbol('edgelessToolbarSlotsContext')
);

export const edgelessToolbarThemeContext = createContext<ColorScheme>(
  Symbol('edgelessToolbarThemeContext')
);

export const edgelessToolbarContext = createContext<EdgelessToolbarWidget>(
  Symbol('edgelessToolbarContext')
);
