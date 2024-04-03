import type { Chain, InitCommandCtx } from '@blocksuite/block-std';
import {
  AIDoneIcon,
  AIPenIcon,
  ImproveWritingIcon,
  LanguageIcon,
  LongerIcon,
  matchFlavours,
  ShorterIcon,
  ToneIcon,
} from '@blocksuite/blocks';
import type {
  AffineAIItemConfig,
  AffineAIItemGroupConfig,
} from '@blocksuite/presets';

import { textToTextStream } from './request';

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

const translateSubItem: AffineAIItemConfig[] = [
  'English',
  'Spanish',
  'German',
  'French',
  'Italian',
  'Simplified Chinese',
  'Traditional Chinese',
  'Japanese',
  'Russian',
  'Korean',
].map(lang => ({
  name: lang,
  textToTextStream(doc, selected) {
    const prompt = `Translate the following content to ${lang}: ${selected}`;
    return textToTextStream(doc, prompt);
  },
}));

const changeToneTo: AffineAIItemConfig[] = [
  'professional',
  'informal',
  'friendly',
  'critical',
].map(tone => ({
  name: tone,
  textToTextStream(doc, selected) {
    const prompt = `Change the tone of the following content to ${tone}: ${selected}`;
    return textToTextStream(doc, prompt);
  },
}));

const DocAIGroup: AffineAIItemGroupConfig = {
  name: 'edit',
  items: [
    {
      name: 'Summary',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      textToTextStream(doc, selected) {
        const prompt = `
        Summarize the key points from the following content in a clear and concise manner,
        suitable for a reader who is seeking a quick understanding of the original content.
        Ensure to capture the main ideas and any significant details without unnecessary elaboration:

        ${selected}
        `;
        return textToTextStream(doc, prompt);
      },
    },
    {
      name: 'Translate to',
      icon: LanguageIcon,
      showWhen: textBlockShowWhen,
      subItems: translateSubItem,
    },
    {
      name: 'Change tone to',
      icon: ToneIcon,
      showWhen: textBlockShowWhen,
      subItems: changeToneTo,
    },
    {
      name: 'Improve writing for it',
      icon: ImproveWritingIcon,
      showWhen: textBlockShowWhen,
      textToTextStream(doc, selected) {
        const prompt = `Improve the writing of the following content: ${selected}`;
        return textToTextStream(doc, prompt);
      },
    },
    {
      name: 'Improve grammar for it',
      icon: AIDoneIcon,
      textToTextStream(doc, selected) {
        const prompt = `Improve the grammar of the following content: ${selected}`;
        return textToTextStream(doc, prompt);
      },
    },
    {
      name: 'Fix spelling for it',
      icon: AIDoneIcon,
      textToTextStream(doc, selected) {
        const prompt = `Fix the spelling of the following content: ${selected}`;
        return textToTextStream(doc, prompt);
      },
    },
    {
      name: 'Create headings',
      icon: AIPenIcon,
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
      textToTextStream(doc, selected) {
        const prompt = `Create headings for the following content: ${selected}`;
        return textToTextStream(doc, prompt);
      },
    },
    {
      name: 'Make longer',
      icon: LongerIcon,
      showWhen: textBlockShowWhen,
      textToTextStream(doc, selected) {
        const prompt = `Make the following content longer: ${selected}`;
        return textToTextStream(doc, prompt);
      },
    },
    {
      name: 'Make shorter',
      icon: ShorterIcon,
      showWhen: textBlockShowWhen,
      textToTextStream(doc, selected) {
        const prompt = `Make the following content shorter: ${selected}`;
        return textToTextStream(doc, prompt);
      },
    },
  ],
};

export const actionGroups: AffineAIItemGroupConfig[] = [DocAIGroup];
