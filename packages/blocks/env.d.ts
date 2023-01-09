import type { ParagraphBlockModel } from './paragraph-block/index.js';
import type { PageBlockModel } from './page-block/index.js';
import type { ListBlockModel } from './list-block/index.js';
import type { FrameBlockModel } from './frame-block/index.js';
import type { CodeBlockModel } from './code-block/index.js';
import type { DividerBlockModel } from './divider-block/index.js';
import type { EmbedBlockModel } from './embed-block/index.js';
import type { SurfaceBlockModel } from './surface-block/index.js';

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
