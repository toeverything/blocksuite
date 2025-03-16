import { getConnectorText } from '../../../utils/text.js';
import { ElementToPlainTextAdapterExtension } from '../type.js';

export const connectorToPlainTextAdapterMatcher =
  ElementToPlainTextAdapterExtension({
    name: 'connector',
    match: elementModel => elementModel.type === 'connector',
    toAST: elementModel => {
      const text = getConnectorText(elementModel);
      const content = `Connector, with text label "${text}"`;
      return { content };
    },
  });
