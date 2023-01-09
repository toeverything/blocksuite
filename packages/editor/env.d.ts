import type { ParagraphBlockModel } from '@blocksuite/blocks';
import type { PageBlockModel } from '@blocksuite/blocks';
import type { ListBlockModel } from '@blocksuite/blocks';
import type { FrameBlockModel } from '@blocksuite/blocks';
import type { CodeBlockModel } from '@blocksuite/blocks';
import type { DividerBlockModel } from '@blocksuite/blocks';
import type { EmbedBlockModel } from '@blocksuite/blocks';
import type { SurfaceBlockModel } from '@blocksuite/blocks';

declare module '@blocksuite/store' {
  interface BlockModels {
    'affine:paragraph': ParagraphBlockModel;
    'affine:page': PageBlockModel;
    'affine:list': ListBlockModel;
    'affine:frame': FrameBlockModel;
    'affine:code': CodeBlockModel;
    'affine:divider': DividerBlockModel;
    'affine:embed': EmbedBlockModel;
    // 'affine:shape': ShapeBlockModel,
    'affine:surface': SurfaceBlockModel;
  }
}
