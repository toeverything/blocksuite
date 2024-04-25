import type { Chain, InitCommandCtx } from '@blocksuite/block-std';
import {
  AIDoneIcon,
  type AIItemGroupConfig,
  AIPenIcon,
  type AISubItemConfig,
  ChatWithAIIcon,
  ImproveWritingIcon,
  LanguageIcon,
  LongerIcon,
  matchFlavours,
  ShorterIcon,
  ToneIcon,
} from '@blocksuite/blocks';

import { actionToHandler } from '../../actions/handler.js';
import { textTones, translateLangs } from '../../actions/types.js';
import { getAIPanel } from '../../ai-panel.js';
import { AIProvider } from '../../provider.js';

export const translateSubItem: AISubItemConfig[] = translateLangs.map(lang => {
  return {
    type: lang,
    handler: actionToHandler('translate', { lang }),
  };
});

export const toneSubItem: AISubItemConfig[] = textTones.map(tone => {
  return {
    type: tone,
    handler: actionToHandler('changeTone', { tone }),
  };
});

// TODO: improve the logic, to make it more accurate
const textBlockShowWhen = (chain: Chain<InitCommandCtx>) => {
  const [_, ctx] = chain
    .getSelectedModels({
      types: ['block', 'text'],
    })
    .run();
  const { selectedModels } = ctx;
  if (!selectedModels || selectedModels.length === 0) return false;

  return selectedModels.some(model =>
    matchFlavours(model, ['affine:paragraph', 'affine:list'])
  );
};

const codeBlockShowWhen = (chain: Chain<InitCommandCtx>) => {
  const [_, ctx] = chain
    .getSelectedModels({
      types: ['block', 'text'],
    })
    .run();
  const { selectedModels } = ctx;
  if (!selectedModels || selectedModels.length > 1) return false;

  const model = selectedModels[0];
  return matchFlavours(model, ['affine:code']);
};

const imageBlockShowWhen = (chain: Chain<InitCommandCtx>) => {
  const [_, ctx] = chain
    .getSelectedModels({
      types: ['block'],
    })
    .run();
  const { selectedModels } = ctx;
  if (!selectedModels || selectedModels.length > 1) return false;

  const model = selectedModels[0];
  return matchFlavours(model, ['affine:image']);
};

const EditAIGroup: AIItemGroupConfig = {
  name: 'edit with ai',
  items: [
    {
      name: 'Translate to',
      icon: LanguageIcon,
      showWhen: textBlockShowWhen,
      subItem: translateSubItem,
    },
    {
      name: 'Change tone to',
      icon: ToneIcon,
      showWhen: textBlockShowWhen,
      subItem: toneSubItem,
    },
    {
      name: 'Improve writing',
      icon: ImproveWritingIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('improveWriting'),
    },
    {
      name: 'Make longer',
      icon: LongerIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('makeLonger'),
    },
    {
      name: 'Make shorter',
      icon: ShorterIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('makeShorter'),
    },
    {
      name: 'Continue writing',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('continueWriting'),
    },
  ],
};

const DraftAIGroup: AIItemGroupConfig = {
  name: 'draft with ai',
  items: [
    {
      name: 'Write an article about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('writeArticle'),
    },
    {
      name: 'Write a tweet about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('writeTwitterPost'),
    },
    {
      name: 'Write a poem about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('writePoem'),
    },
    {
      name: 'Write a blog post about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('writeBlogPost'),
    },
    {
      name: 'Brainstorm ideas about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('brainstorm'),
    },
    {
      name: 'Write a story about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('writeStory'),
    },
  ],
};

const ReviewWIthAIGroup: AIItemGroupConfig = {
  name: 'review with ai',
  items: [
    {
      name: 'Improve grammar',
      icon: AIDoneIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('improveGrammar'),
    },
    {
      name: 'Fix spelling',
      icon: AIDoneIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('fixSpelling'),
    },
    {
      name: 'Explain this image',
      icon: AIPenIcon,
      showWhen: imageBlockShowWhen,
      handler: actionToHandler('explainImage'),
    },
    {
      name: 'Explain this code',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('explainCode'),
    },
    {
      name: 'Check code error',
      icon: AIPenIcon,
      showWhen: codeBlockShowWhen,
      handler: actionToHandler('checkCodeErrors'),
    },
    {
      name: 'Explain selection',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('explain'),
    },
  ],
};

const GenerateWithAIGroup: AIItemGroupConfig = {
  name: 'generate with ai',
  items: [
    {
      name: 'Summarize',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('summary'),
    },
    {
      name: 'Find action items from it',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('findActions'),
    },
    {
      name: 'Generate headings',
      icon: AIPenIcon,
      handler: actionToHandler('createHeadings'),
      showWhen: chain => {
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['block', 'text'],
          })
          .run();
        const { selectedModels } = ctx;
        if (!selectedModels || selectedModels.length === 0) return false;

        return selectedModels.every(
          model =>
            matchFlavours(model, ['affine:paragraph', 'affine:list']) &&
            !model.type.startsWith('h')
        );
      },
    },
    {
      name: 'Write a outline from this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('writeOutline'),
    },
  ],
};

const OthersAIGroup: AIItemGroupConfig = {
  name: 'Others',
  items: [
    {
      name: 'Chat with AI',
      icon: ChatWithAIIcon,
      handler: host => {
        const panel = getAIPanel(host);
        AIProvider.slots.requestContinueInChat.emit({
          host: host,
          show: true,
        });
        panel.hide();
      },
    },
  ],
};

export const AIItemGroups: AIItemGroupConfig[] = [
  EditAIGroup,
  DraftAIGroup,
  ReviewWIthAIGroup,
  GenerateWithAIGroup,
  OthersAIGroup,
];
