import { getMindMapTreeText } from '../../../utils/text.js';
import { ElementToPlainTextAdapterExtension } from '../type.js';

export const mindmapToPlainTextAdapterMatcher =
  ElementToPlainTextAdapterExtension({
    name: 'mindmap',
    match: elementModel => elementModel.type === 'mindmap',
    toAST: (elementModel, context) => {
      const mindMapContent = getMindMapTreeText(elementModel, context.elements);
      return { content: mindMapContent };
    },
  });
