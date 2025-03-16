import type { GfxModel } from '@blocksuite/block-std/gfx';

import type {
  BrushElementModel,
  ConnectorElementModel,
  GroupElementModel,
} from '../elements';

export type EmbedCardStyle =
  | 'horizontal'
  | 'horizontalThin'
  | 'list'
  | 'vertical'
  | 'cube'
  | 'cubeThick'
  | 'video'
  | 'figma'
  | 'html'
  | 'syncedDoc'
  | 'pdf';

export type LinkPreviewData = {
  description: string | null;
  icon: string | null;
  image: string | null;
  title: string | null;
};

export type Connectable = Exclude<
  GfxModel,
  ConnectorElementModel | BrushElementModel | GroupElementModel
>;

export type BlockMeta = {
  'meta:createdAt'?: number;
  'meta:createdBy'?: string;
  'meta:updatedAt'?: number;
  'meta:updatedBy'?: string;
};
