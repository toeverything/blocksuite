import { getAISpecs } from '@blocksuite/presets';

import { actionGroups } from './actions';
import { textToTextStream } from './request';

export function getParsedAISpecs() {
  return getAISpecs({
    actionGroups: actionGroups,
    getAskAIStream(doc, chat) {
      return textToTextStream(doc, chat);
    },
  });
}
