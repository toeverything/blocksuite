import type { ParagraphBlockModel } from '@blocksuite/blocks/models';
import type { PageBlockModel } from '@blocksuite/blocks/models';
import type { ListBlockModel } from '@blocksuite/blocks/models';
import type { FrameBlockModel } from '@blocksuite/blocks/models';
import type { CodeBlockModel } from '@blocksuite/blocks/models';
import type { DividerBlockModel } from '@blocksuite/blocks/models';
import type { EmbedBlockModel } from '@blocksuite/blocks/models';
import type { SurfaceBlockModel } from '@blocksuite/blocks/models';

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
