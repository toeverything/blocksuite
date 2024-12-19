import {
  BlockMarkdownAdapterExtension,
  type BlockMarkdownAdapterMatcher,
} from '@blocksuite/affine-shared/adapters';

import { SurfaceBlockSchema } from '../../surface-model.js';
import { getMindMapNodeMap } from '../utils/mindmap.js';
import { MarkdownElementModelAdapter } from './element-adapter/index.js';

export const surfaceBlockMarkdownAdapterMatcher: BlockMarkdownAdapterMatcher = {
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

export const SurfaceBlockMarkdownAdapterExtension =
  BlockMarkdownAdapterExtension(surfaceBlockMarkdownAdapterMatcher);

export const edgelessSurfaceBlockMarkdownAdapterMatcher: BlockMarkdownAdapterMatcher =
  {
    flavour: SurfaceBlockSchema.model.flavour,
    toMatch: () => false,
    fromMatch: o => o.node.flavour === SurfaceBlockSchema.model.flavour,
    toBlockSnapshot: {},
    fromBlockSnapshot: {
      enter: (o, context) => {
        const { walkerContext } = context;
        const markdownElementModelAdapter = new MarkdownElementModelAdapter();
        if ('elements' in o.node.props) {
          const elements = o.node.props.elements as Record<
            string,
            Record<string, unknown>
          >;
          // Get all the node maps of mindMap elements
          const mindMapArray = Object.entries(elements)
            .filter(([_, element]) => element.type === 'mindmap')
            .map(([_, element]) => getMindMapNodeMap(element));
          walkerContext.setGlobalContext(
            'surface:mindMap:nodeMapArray',
            mindMapArray
          );

          Object.entries(
            o.node.props.elements as Record<string, Record<string, unknown>>
          ).forEach(([_, element]) => {
            const markdownAST = markdownElementModelAdapter.fromElementModel(
              element,
              { walkerContext, elements }
            );
            if (markdownAST) {
              walkerContext.openNode(markdownAST, 'children').closeNode();
            }
          });
        }
      },
    },
  };

export const EdgelessSurfaceBlockMarkdownAdapterExtension =
  BlockMarkdownAdapterExtension(edgelessSurfaceBlockMarkdownAdapterMatcher);
