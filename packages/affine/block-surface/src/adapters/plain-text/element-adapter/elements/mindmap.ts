import type { MindMapTreeNode } from '../../../types/mindmap.js';
import type { ElementModelToPlainTextAdapterMatcher } from '../type.js';

import { buildMindMapTree } from '../../../utils/mindmap.js';
import { getShapeText } from '../../../utils/shape.js';

export const mindmapToPlainTextAdapterMatcher: ElementModelToPlainTextAdapterMatcher =
  {
    name: 'mindmap',
    match: elementModel => elementModel.type === 'mindmap',
    toAST: (elementModel, context) => {
      let content = '';
      const mindMapTree = buildMindMapTree(elementModel);
      if (!mindMapTree) {
        return { content };
      }
      // traverse the mindMapTree and construct the content string
      // like:
      // - Root
      //   - Child 1
      //     - Child 1.1
      //     - Child 1.2
      //   - Child 2
      //     - Child 2.1
      //     - Child 2.2
      //   - Child 3
      //     - Child 3.1
      //     - Child 3.2
      const { elements } = context;
      let layer = 0;
      let mindMapContent = '';
      const traverseMindMapTree = (node: MindMapTreeNode, prefix: string) => {
        const shapeElement = elements[node.id as string];
        const shapeText = getShapeText(shapeElement);
        if (shapeElement) {
          mindMapContent += `${prefix.repeat(layer * 4)}- ${shapeText}\n`;
        }
        node.children.forEach(child => {
          layer++;
          traverseMindMapTree(child, prefix);
          layer--;
        });
      };
      traverseMindMapTree(mindMapTree, ' ');
      content = `Mind Map with nodes:\n${mindMapContent}`;
      return { content };
    },
  };
