import type { EdgelessBlockModel } from './edgeless-block-model.js';

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
  }
}
