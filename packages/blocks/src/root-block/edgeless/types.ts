import type { GfxModel as EModel } from '@blocksuite/block-std/gfx';

import type { EdgelessBlockModel } from './edgeless-block-model.js';

export type EdgelessTool = BlockSuite.EdgelessToolType;

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {}
    type EdgelessBlockModelKeyType = keyof EdgelessBlockModelMap;
    type EdgelessBlockModelType =
      | EdgelessBlockModelMap[EdgelessBlockModelKeyType]
      | EdgelessBlockModel;

    type EdgelessModel = EModel;
    type EdgelessModelKeys = EdgelessBlockModelKeyType | SurfaceModelKeyType;

    interface EdgelessTextModelMap {}
    type EdgelessTextModelKeyType = keyof EdgelessTextModelMap;
    type EdgelessTextModelType = EdgelessTextModelMap[EdgelessTextModelKeyType];

    interface EdgelessToolControllerMap {}
    type EdgelessToolControllerKeyType = keyof EdgelessToolMap;
    type EdgelessToolControllerType =
      EdgelessToolMap[EdgelessToolControllerKeyType];
    type EdgelessToolType = EdgelessToolControllerType['tool'];
  }
}
