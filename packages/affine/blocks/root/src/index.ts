import type * as BrushEffect from '@blocksuite/affine-gfx-brush';
import type * as NoteEffect from '@blocksuite/affine-gfx-note';
import type * as PointerEffect from '@blocksuite/affine-gfx-pointer';
import type * as ShapeEffect from '@blocksuite/affine-gfx-shape';

export * from './adapters';
export * from './clipboard/index.js';
export * from './common-specs/index.js';
export * from './edgeless/edgeless-builtin-spec.js';
export * from './edgeless/edgeless-root-spec.js';
export * from './edgeless/index.js';
export * from './page/page-root-block.js';
export { PageRootService } from './page/page-root-service.js';
export * from './page/page-root-spec.js';
export * from './preview/preview-root-block.js';
export { RootService } from './root-service.js';
export * from './types.js';
export * from './utils/index.js';
export * from './widgets/index.js';

declare type _GLOBAL_ =
  | typeof PointerEffect
  | typeof NoteEffect
  | typeof BrushEffect
  | typeof ShapeEffect;
