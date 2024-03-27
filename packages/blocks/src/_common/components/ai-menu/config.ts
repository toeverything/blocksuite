import type { Chain, InitCommandCtx } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import {
  AIDoneIcon,
  AIPenIcon,
  AISearchIcon,
  ExplainIcon,
  ImproveWritingIcon,
  LanguageIcon,
  LongerIcon,
  MakeItRealIcon,
  ShorterIcon,
  TagIcon,
  ToneIcon,
} from '../../icons/ai.js';
import type { EditorMode } from '../../types.js';
import { matchFlavours } from '../../utils/model.js';

export type AIGroup =
  | 'doc'
  | 'edit'
  | 'draft'
  | 'mindMap'
  | 'create'
  | 'code'
  | 'presentation'
  | 'draw'
  | 'others';

export interface AISubMenuConfigItem {
  type: string;
  handler?: () => void;
}

export interface AIMenuConfigItem {
  name: string;
  icon: TemplateResult | (() => HTMLElement);
  showWhen: (chain: Chain<InitCommandCtx>, editorMode: EditorMode) => boolean;
  subConfig?: AISubMenuConfigItem[];
  /**
   * TODO：add parameter to the handler function and implement the logic under each handler item
   */
  handler?: () => void;
}

export interface AIConfigGroup {
  name: AIGroup;
  items: AIMenuConfigItem[];
}

export const TranslateSubConfig: AISubMenuConfigItem[] = [
  {
    type: 'English',
    handler: () => {
      // TODO: implement the logic to translate to English
    },
  },
  { type: 'Spanish' },
  { type: 'German' },
  { type: 'French' },
  { type: 'Italian' },
  { type: 'Simplified Chinese' },
  { type: 'Traditional Chinese' },
  { type: 'Japanese' },
  { type: 'Russian' },
  { type: 'Korean' },
];

export const ToneSubConfig: AISubMenuConfigItem[] = [
  { type: 'professional' },
  { type: 'informal' },
  { type: 'friendly' },
  { type: 'critical' },
];

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
      types: ['text'],
    })
    .run();
  const { selectedModels } = ctx;
  if (!selectedModels || selectedModels.length > 1) return false;

  const model = selectedModels[0];
  return matchFlavours(model, ['affine:code']);
};

export const DocAIGroup: AIConfigGroup = {
  name: 'doc',
  items: [
    {
      name: 'Summary',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: () => {
        // TODO: Implement the logic to summarize the text
      },
    },
  ],
};

export const EditAIGroup: AIConfigGroup = {
  name: 'edit',
  items: [
    {
      name: 'Translate to',
      icon: LanguageIcon,
      showWhen: textBlockShowWhen,
      subConfig: TranslateSubConfig,
    },
    {
      name: 'Change tone to',
      icon: ToneIcon,
      showWhen: textBlockShowWhen,
      subConfig: ToneSubConfig,
    },
    {
      name: 'Improve writing for it',
      icon: ImproveWritingIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Improve grammar for it',
      icon: AIDoneIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Fix spelling for it',
      icon: AIDoneIcon,
      showWhen: textBlockShowWhen,
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
    },
    {
      name: 'Make longer',
      icon: LongerIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Make shorter',
      icon: ShorterIcon,
      showWhen: textBlockShowWhen,
    },
  ],
};

export const DraftAIGroup: AIConfigGroup = {
  name: 'draft',
  items: [
    {
      name: 'Write an article about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Write a Twitter about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Write a poem about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Write a blog post about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Brainstorm ideas about this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Write a outline from this',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
    },
  ],
};

export const MindMapAIGroup: AIConfigGroup = {
  name: 'mindMap',
  items: [
    {
      name: 'Explain from this mind-map node',
      icon: ExplainIcon,
      showWhen: (chain, editorMode) => {
        if (editorMode === 'page') {
          return false;
        }

        // TODO: complete this logic
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['text'],
          })
          .run();
        const { selectedModels } = ctx;
        if (!selectedModels || selectedModels.length > 1) return false;
        return true;
      },
    },
    {
      name: 'Brainstorm ideas with mind-map',
      icon: ExplainIcon,
      showWhen: (chain, editorMode) => {
        if (editorMode === 'page') {
          return false;
        }

        // TODO: complete this logic
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['text'],
          })
          .run();
        const { selectedModels } = ctx;
        if (!selectedModels || !selectedModels.length) return false;
        return selectedModels.every(model =>
          matchFlavours(model, ['affine:paragraph', 'affine:list'])
        );
      },
    },
  ],
};

export const CreateAIGroup: AIConfigGroup = {
  name: 'create',
  items: [
    {
      name: 'Make it real',
      icon: MakeItRealIcon,
      showWhen: (chain, editorMode) => {
        if (editorMode === 'page') {
          return false;
        }

        // TODO: complete this logic
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['text'],
          })
          .run();
        const { selectedModels } = ctx;
        if (!selectedModels || selectedModels.length > 1) return false;

        const model = selectedModels[0];
        return matchFlavours(model, ['affine:frame']);
      },
    },
  ],
};

export const CodeAIGroup: AIConfigGroup = {
  name: 'code',
  items: [
    {
      name: 'Check code error',
      icon: AIPenIcon,
      showWhen: codeBlockShowWhen,
    },
  ],
};

export const PresentationAIGroup: AIConfigGroup = {
  name: 'presentation',
  items: [
    {
      name: 'Create a presentation',
      icon: AIPenIcon,
      showWhen: (chain, editorMode) => {
        if (editorMode === 'page') {
          return false;
        }

        // TODO: complete this logic
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['text'],
          })
          .run();
        const { selectedModels } = ctx;
        if (!selectedModels || !selectedModels.length) return false;
        return selectedModels.every(model =>
          matchFlavours(model, ['affine:paragraph', 'affine:list'])
        );
      },
    },
  ],
};

export const DrawAIGroup: AIConfigGroup = {
  name: 'draw',
  items: [
    {
      name: 'Generate a image about this',
      icon: MakeItRealIcon,
      showWhen: (chain, editorMode) => {
        if (editorMode === 'page') {
          return false;
        }

        // TODO: complete this logic
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['text'],
          })
          .run();
        const { selectedModels } = ctx;
        if (!selectedModels || selectedModels.length > 1) return false;

        const model = selectedModels[0];
        return matchFlavours(model, ['affine:frame']);
      },
    },
  ],
};

export const OthersAIGroup: AIConfigGroup = {
  name: 'others',
  items: [
    {
      name: 'Summary the webpage',
      icon: AIPenIcon,
      showWhen: chain => {
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['block', 'text'],
          })
          .run();
        const { selectedModels } = ctx;
        if (!selectedModels || selectedModels.length > 1) return false;

        const model = selectedModels[0];
        return matchFlavours(model, [
          'affine:bookmark',
          'affine:embed-linked-doc',
        ]);
      },
    },
    {
      name: 'Explain this image',
      icon: AIPenIcon,
      showWhen: chain => {
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['block', 'text', 'image'],
          })
          .run();
        const { selectedModels } = ctx;
        if (!selectedModels || selectedModels.length > 1) return false;

        const model = selectedModels[0];
        return matchFlavours(model, ['affine:image', 'affine:surface-ref']);
      },
    },
    {
      name: 'Explain this code',
      icon: AIPenIcon,
      showWhen: codeBlockShowWhen,
    },
    {
      name: 'Find handler items from it',
      icon: AISearchIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Explain this',
      icon: ExplainIcon,
      showWhen: textBlockShowWhen,
    },
    {
      name: 'Add tag for this doc',
      icon: TagIcon,
      showWhen: () => {
        // TODO: nice to have, currently not supported
        return false;
      },
    },
  ],
};

export const AIConfigGroups: AIConfigGroup[] = [
  DocAIGroup,
  EditAIGroup,
  DraftAIGroup,
  MindMapAIGroup,
  CreateAIGroup,
  CodeAIGroup,
  PresentationAIGroup,
  DrawAIGroup,
  OthersAIGroup,
];
