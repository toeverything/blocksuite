import type { GfxPrimitiveElementModel } from '@blocksuite/block-std/gfx';

import type { OmitFunctionsAndKeysAndReadOnly } from './utility-type.js';

export type ModelToProps<
  T extends GfxPrimitiveElementModel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  K extends keyof any,
> = OmitFunctionsAndKeysAndReadOnly<
  T,
  K | 'yMap' | 'surface' | 'display' | 'opacity' | 'externalXYWH'
>;

export type { PointTestOptions } from '@blocksuite/block-std/gfx';

export type {
  BaseElementProps,
  SerializedElement,
} from '@blocksuite/block-std/gfx';

export {
  GfxGroupLikeElementModel as SurfaceGroupLikeModel,
  GfxLocalElementModel as SurfaceLocalModel,
  GfxPrimitiveElementModel as SurfaceElementModel,
} from '@blocksuite/block-std/gfx';
