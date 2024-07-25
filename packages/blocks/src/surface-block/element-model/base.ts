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

export type { ElementHitTestOptions } from '@blocksuite/block-std/gfx';

import type {
  GfxPrimitiveElementModel as ElementModel,
  GfxGroupLikeElementModel as GroupLikeModel,
  GfxLocalElementModel as LocalModel,
} from '@blocksuite/block-std/gfx';

export type {
  BaseElementProps,
  SerializedElement,
} from '@blocksuite/block-std/gfx';

export {
  GfxGroupLikeElementModel as SurfaceGroupLikeModel,
  GfxLocalElementModel as SurfaceLocalModel,
  GfxPrimitiveElementModel as SurfaceElementModel,
} from '@blocksuite/block-std/gfx';

declare global {
  namespace BlockSuite {
    interface SurfaceElementModelMap {}
    type SurfaceElementModelKeys = keyof SurfaceElementModelMap;
    type SurfaceElementModel =
      | SurfaceElementModelMap[SurfaceElementModelKeys]
      | ElementModel;

    interface SurfaceGroupLikeModelMap {}
    type SurfaceGroupLikeModelKeys = keyof SurfaceGroupLikeModelMap;
    type SurfaceGroupLikeModel =
      | SurfaceGroupLikeModelMap[SurfaceGroupLikeModelKeys]
      | GroupLikeModel;

    interface SurfaceLocalModelMap {}
    type SurfaceLocalModelKeys = keyof SurfaceLocalModelMap;
    type SurfaceLocalModel =
      | SurfaceLocalModelMap[SurfaceLocalModelKeys]
      | LocalModel;

    // not include local model
    type SurfaceModel = SurfaceElementModel | SurfaceGroupLikeModel;
    type SurfaceModelKeyType =
      | SurfaceElementModelKeys
      | SurfaceGroupLikeModelKeys;
  }
}
