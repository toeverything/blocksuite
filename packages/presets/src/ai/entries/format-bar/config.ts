import type { Chain, InitCommandCtx } from '@blocksuite/block-std';
import { matchFlavours } from '@blocksuite/blocks';

import {
  AIDoneIcon,
  AIPenIcon,
  ImproveWritingIcon,
  LanguageIcon,
  LongerIcon,
  ShorterIcon,
  ToneIcon,
} from '../../_common/icons.js';
import { actionToHandler } from '../../actions/handler.js';
import { textTones, translateLangs } from '../../actions/types.js';
import type {
  AIItemGroupConfig,
  AISubItemConfig,
} from '../../widgets/ai-item/types.js';

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

const DocAIGroup: AIItemGroupConfig = {
  name: 'doc with ai',
  items: [
    {
      name: 'Summary',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('summary'),
    },
  ],
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
      name: 'Improve writing for it',
      icon: ImproveWritingIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('improveWriting'),
    },
    {
      name: 'Improve grammar for it',
      icon: AIDoneIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('improveGrammar'),
    },
    {
      name: 'Fix spelling for it',
      icon: AIDoneIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('fixSpelling'),
    },
    {
      name: 'Create headings',
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
  ],
};

const DraftAIGroup: AIItemGroupConfig = {
  name: 'draft',
  items: [
    {
      name: 'Write an article about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('writeArticle'),
    },
    {
      name: 'Write a Twitter about this',
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
      name: 'Write a outline from this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('writeOutline'),
    },
  ],
};

const CodeAIGroup: AIItemGroupConfig = {
  name: 'code with ai',
  items: [
    {
      name: 'Check code error',
      icon: AIPenIcon,
      showWhen: codeBlockShowWhen,
      handler: actionToHandler('checkCodeErrors'),
    },
    {
      name: 'Explain this code',
      icon: AIPenIcon,
      showWhen: codeBlockShowWhen,
      handler: actionToHandler('explainCode'),
    },
  ],
};

const ImageAIGroup: AIItemGroupConfig = {
  name: 'image with ai',
  items: [
    {
      name: 'Explain this image',
      icon: AIPenIcon,
      showWhen: imageBlockShowWhen,
      handler: actionToHandler('explainImage'),
    },
  ],
};

export const AIItemGroups: AIItemGroupConfig[] = [
  DocAIGroup,
  EditAIGroup,
  DraftAIGroup,
  CodeAIGroup,
  ImageAIGroup,
];
