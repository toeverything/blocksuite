import { assertEquals } from '@blocksuite/global/utils';

import {
  type EdgelessModelConstructor,
  EdgelessTransformableRegistry,
  type EdgelessTransformController,
} from './transform-controller.js';

export const Transformable =
  <
    Model extends BlockSuite.EdgelessModelType = BlockSuite.EdgelessModelType,
    Controller extends
      EdgelessTransformController<Model> = EdgelessTransformController<Model>,
  >(
    transformController: Controller
  ) =>
  (Class: EdgelessModelConstructor<Model>, context: ClassDecoratorContext) => {
    assertEquals(context.kind, 'class');
    EdgelessTransformableRegistry.register(Class, transformController);
  };
