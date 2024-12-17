import {
  BlockPlainTextAdapterExtension,
  type BlockPlainTextAdapterMatcher,
} from '@blocksuite/affine-shared/adapters';

import type { ElementModelMap } from '../../element-model/index.js';

import { SurfaceBlockSchema } from '../../surface-model.js';
import { PlainTextElementModelAdapter } from './element-adapter/index.js';

export const surfaceBlockPlainTextAdapterMatcher: BlockPlainTextAdapterMatcher =
  {
    flavour: SurfaceBlockSchema.model.flavour,
    toMatch: () => false,
    fromMatch: o => o.node.flavour === SurfaceBlockSchema.model.flavour,
    toBlockSnapshot: {},
    fromBlockSnapshot: {
      enter: (_, context) => {
        context.walkerContext.skipAllChildren();
      },
    },
  };

export const SurfaceBlockPlainTextAdapterExtension =
  BlockPlainTextAdapterExtension(surfaceBlockPlainTextAdapterMatcher);

export const edgelessSurfaceBlockPlainTextAdapterMatcher: BlockPlainTextAdapterMatcher =
  {
    flavour: SurfaceBlockSchema.model.flavour,
    toMatch: () => false,
    fromMatch: o => o.node.flavour === SurfaceBlockSchema.model.flavour,
    toBlockSnapshot: {},
    fromBlockSnapshot: {
      enter: (o, context) => {
        const plainTextElementModelAdapter = new PlainTextElementModelAdapter();
        if ('elements' in o.node.props) {
          Object.entries(
            o.node.props.elements as Record<string, Record<string, unknown>>
          ).forEach(([_, elementModel]) => {
            const element =
              elementModel as unknown as ElementModelMap[keyof ElementModelMap];
            const plainText =
              plainTextElementModelAdapter.fromElementModel(element);
            if (plainText) {
              context.textBuffer.content += plainText + '\n';
            }
          });
        }
      },
    },
  };

export const EdgelessSurfaceBlockPlainTextAdapterExtension =
  BlockPlainTextAdapterExtension(edgelessSurfaceBlockPlainTextAdapterMatcher);
