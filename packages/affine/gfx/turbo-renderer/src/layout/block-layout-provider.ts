import type { GfxBlockComponent } from '@blocksuite/block-std';
import { createIdentifier } from '@blocksuite/global/di';
import { Extension } from '@blocksuite/store';

import type { BlockLayout, Rect } from '../types';

export abstract class BlockLayoutHandlerExtension<
  T extends BlockLayout = BlockLayout,
> extends Extension {
  abstract readonly blockType: string;
  abstract queryLayout(component: GfxBlockComponent): T | null;
  abstract calculateBound(layout: T): {
    rect: Rect;
    subRects: Rect[];
  };
}

export const BlockLayoutHandlersIdentifier =
  createIdentifier<BlockLayoutHandlerExtension>(
    'BlockLayoutHandlersIdentifier'
  );
