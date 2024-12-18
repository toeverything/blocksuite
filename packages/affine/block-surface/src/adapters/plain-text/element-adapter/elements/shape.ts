import type { MindMapTreeNode } from '../../../types/mindmap.js';
import type { ElementModelToPlainTextAdapterMatcher } from '../type.js';

import { getShapeText } from '../../../utils/shape.js';

export const shapeToPlainTextAdapterMatcher: ElementModelToPlainTextAdapterMatcher =
  {
    name: 'shape',
    match: elementModel => elementModel.type === 'shape',
    toAST: (elementModel, context) => {
      let content = '';
      const { walkerContext } = context;
      const mindMapNodeMaps = walkerContext.getGlobalContext(
        'surface:mindMap:nodeMapArray'
      ) as Array<Map<string, MindMapTreeNode>>;
      if (mindMapNodeMaps && mindMapNodeMaps.length > 0) {
        // Check if the elementModel is a mindMap node
        // If it is, we should return { content: '' } directly
        // And get the content when we handle the whole mindMap
        const isMindMapNode = mindMapNodeMaps.some(nodeMap =>
          nodeMap.has(elementModel.id as string)
        );
        if (isMindMapNode) {
          return { content };
        }
      }

      // If it is not, we should return the text and shapeType
      const text = getShapeText(elementModel);
      let shapeType = '';
      if (
        'shapeType' in elementModel &&
        typeof elementModel.shapeType === 'string'
      ) {
        shapeType =
          elementModel.shapeType.charAt(0).toUpperCase() +
          elementModel.shapeType.slice(1);
      }
      content = `${shapeType}, with text label "${text}"`;
      return { content };
    },
  };
