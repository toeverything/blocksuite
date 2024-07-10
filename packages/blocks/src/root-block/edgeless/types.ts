import type { EdgelessBlockModel } from './edgeless-block-model.js';

export type EdgelessTool = BlockSuite.EdgelessToolType;

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {}
    type EdgelessBlockModelKeyType = keyof EdgelessBlockModelMap;
    type EdgelessBlockModelType =
      | EdgelessBlockModelMap[EdgelessBlockModelKeyType]
      | EdgelessBlockModel;

    type EdgelessModelType = EdgelessBlockModelType | SurfaceModelType;
    type EdgelessModelKeyType = EdgelessBlockModelKeyType | SurfaceModelKeyType;

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
