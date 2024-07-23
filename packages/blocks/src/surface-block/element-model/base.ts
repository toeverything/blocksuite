import type { SurfaceElementModel } from '@blocksuite/block-std/edgeless';

import type { OmitFunctionsAndKeysAndReadOnly } from './utility-type.js';

export type ModelToProps<
  T extends SurfaceElementModel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  K extends keyof any,
> = OmitFunctionsAndKeysAndReadOnly<
  T,
  K | 'yMap' | 'surface' | 'display' | 'opacity' | 'externalXYWH'
>;

export type { IHitTestOptions } from '@blocksuite/block-std/edgeless';

import type {
  SurfaceElementModel as ElementModel,
  SurfaceGroupLikeModel as GroupLikeModel,
  SurfaceLocalModel as LocalModel,
} from '@blocksuite/block-std/edgeless';

export type {
  IBaseProps,
  SerializedElement,
} from '@blocksuite/block-std/edgeless';

export {
  SurfaceElementModel,
  SurfaceGroupLikeModel,
  SurfaceLocalModel,
} from '@blocksuite/block-std/edgeless';

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
