import type { Chain, InitCommandCtx } from '@blocksuite/block-std';
import {
  type AIItemGroupConfig,
  AIPenIcon,
  AISearchIcon,
  ExplainIcon,
  MakeItRealIcon,
  matchFlavours,
  TagIcon,
} from '@blocksuite/blocks';

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

const DraftAIGroup: AIItemGroupConfig = {
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

const MindMapAIGroup: AIItemGroupConfig = {
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

const CreateAIGroup: AIItemGroupConfig = {
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

const CodeAIGroup: AIItemGroupConfig = {
  name: 'code',
  items: [
    {
      name: 'Check code error',
      icon: AIPenIcon,
      showWhen: codeBlockShowWhen,
    },
  ],
};

const PresentationAIGroup: AIItemGroupConfig = {
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

const DrawAIGroup: AIItemGroupConfig = {
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

const OthersAIGroup: AIItemGroupConfig = {
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

export const AIItemGroups: AIItemGroupConfig[] = [
  DraftAIGroup,
  MindMapAIGroup,
  CreateAIGroup,
  CodeAIGroup,
  PresentationAIGroup,
  DrawAIGroup,
  OthersAIGroup,
];
