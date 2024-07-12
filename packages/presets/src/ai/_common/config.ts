import type { Chain, EditorHost, InitCommandCtx } from '@blocksuite/block-std';
import type {
  CopilotSelectionController,
  EdgelessElementToolbarWidget,
} from '@blocksuite/blocks';
import type { TemplateResult } from 'lit';

import {
  type AIItemGroupConfig,
  type AISubItemConfig,
  EDGELESS_ELEMENT_TOOLBAR_WIDGET,
  matchFlavours,
} from '@blocksuite/blocks';

import { actionToHandler } from '../actions/doc-handler.js';
import { actionToHandler as edgelessActionToHandler } from '../actions/edgeless-handler.js';
import {
  imageFilterStyles,
  imageProcessingTypes,
  textTones,
  translateLangs,
} from '../actions/types.js';
import { getAIPanel } from '../ai-panel.js';
import { AIProvider } from '../provider.js';
import {
  getSelectedImagesAsBlobs,
  getSelectedTextContent,
  getSelections,
} from '../utils/selection-utils.js';
import {
  AIDoneIcon,
  AIImageIcon,
  AIImageIconWithAnimation,
  AIMindMapIcon,
  AIPenIcon,
  AIPenIconWithAnimation,
  AIPresentationIcon,
  AIPresentationIconWithAnimation,
  AISearchIcon,
  AIStarIconWithAnimation,
  ChatWithAIIcon,
  ExplainIcon,
  ImproveWritingIcon,
  LanguageIcon,
  LongerIcon,
  MakeItRealIcon,
  MakeItRealIconWithAnimation,
  SelectionIcon,
  ShorterIcon,
  ToneIcon,
} from './icons.js';

export const translateSubItem: AISubItemConfig[] = translateLangs.map(lang => {
  return {
    handler: actionToHandler('translate', AIStarIconWithAnimation, { lang }),
    type: lang,
  };
});

export const toneSubItem: AISubItemConfig[] = textTones.map(tone => {
  return {
    handler: actionToHandler('changeTone', AIStarIconWithAnimation, { tone }),
    type: tone,
  };
});

export function createImageFilterSubItem(
  trackerOptions?: BlockSuitePresets.TrackerOptions
) {
  return imageFilterStyles.map(style => {
    return {
      handler: edgelessHandler(
        'filterImage',
        AIImageIconWithAnimation,
        {
          style,
        },
        trackerOptions
      ),
      type: style,
    };
  });
}

export function createImageProcessingSubItem(
  trackerOptions?: BlockSuitePresets.TrackerOptions
) {
  return imageProcessingTypes.map(type => {
    return {
      handler: edgelessHandler(
        'processImage',
        AIImageIconWithAnimation,
        {
          type,
        },
        trackerOptions
      ),
      type,
    };
  });
}

const blockActionTrackerOptions: BlockSuitePresets.TrackerOptions = {
  control: 'block-action-bar',
  where: 'ai-panel',
};

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
  items: [
    {
      icon: LanguageIcon,
      name: 'Translate to',
      showWhen: textBlockShowWhen,
      subItem: translateSubItem,
    },
    {
      icon: ToneIcon,
      name: 'Change tone to',
      showWhen: textBlockShowWhen,
      subItem: toneSubItem,
    },
    {
      handler: actionToHandler('improveWriting', AIStarIconWithAnimation),
      icon: ImproveWritingIcon,
      name: 'Improve writing',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('makeLonger', AIStarIconWithAnimation),
      icon: LongerIcon,
      name: 'Make it longer',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('makeShorter', AIStarIconWithAnimation),
      icon: ShorterIcon,
      name: 'Make it shorter',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('continueWriting', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Continue writing',
      showWhen: textBlockShowWhen,
    },
  ],
  name: 'edit with ai',
};

const DraftAIGroup: AIItemGroupConfig = {
  items: [
    {
      handler: actionToHandler('writeArticle', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Write an article about this',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('writeTwitterPost', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Write a tweet about this',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('writePoem', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Write a poem about this',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('writeBlogPost', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Write a blog post about this',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('brainstorm', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Brainstorm ideas about this',
      showWhen: textBlockShowWhen,
    },
  ],
  name: 'draft with ai',
};

// actions that initiated from a note in edgeless mode
// 1. when running in doc mode, call requestRunInEdgeless (let affine to show toast)
// 2. when running in edgeless mode
//    a. get selected in the note and let the edgeless action to handle it
//    b. insert the result using the note shape
function edgelessHandler<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  generatingIcon: TemplateResult<1>,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >,
  trackerOptions?: BlockSuitePresets.TrackerOptions
) {
  return (host: EditorHost) => {
    if (host.doc.root?.id === undefined) return;
    const edgeless = (
      host.view.getWidget(
        EDGELESS_ELEMENT_TOOLBAR_WIDGET,
        host.doc.root.id
      ) as EdgelessElementToolbarWidget
    )?.edgeless;

    if (!edgeless) {
      AIProvider.slots.requestRunInEdgeless.emit({ host });
    } else {
      edgeless.tools.setEdgelessTool({ type: 'copilot' });
      const currentController = edgeless.tools.controllers[
        'copilot'
      ] as CopilotSelectionController;
      const selectedElements = edgeless.service.selection.selectedElements;
      currentController.updateDragPointsWith(selectedElements, 10);
      currentController.draggingAreaUpdated.emit(false); // do not show edgeless panel

      return edgelessActionToHandler(
        id,
        generatingIcon,
        variants,
        async () => {
          const selections = getSelections(host);
          const [markdown, attachments] = await Promise.all([
            getSelectedTextContent(host),
            getSelectedImagesAsBlobs(host),
          ]);
          // for now if there are more than one selected blocks, we will not omit the attachments
          const sendAttachments =
            selections?.selectedBlocks?.length === 1 && attachments.length > 0;
          return {
            attachments: sendAttachments ? attachments : undefined,
            content: sendAttachments ? '' : markdown,
          };
        },
        trackerOptions
      )(host);
    }
  };
}

const ReviewWIthAIGroup: AIItemGroupConfig = {
  items: [
    {
      handler: actionToHandler('fixSpelling', AIStarIconWithAnimation),
      icon: AIDoneIcon,
      name: 'Fix spelling',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('improveGrammar', AIStarIconWithAnimation),
      icon: AIDoneIcon,
      name: 'Fix grammar',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('explainImage', AIStarIconWithAnimation),
      icon: AIPenIcon,
      name: 'Explain this image',
      showWhen: imageBlockShowWhen,
    },
    {
      handler: actionToHandler('explainCode', AIStarIconWithAnimation),
      icon: ExplainIcon,
      name: 'Explain this code',
      showWhen: codeBlockShowWhen,
    },
    {
      handler: actionToHandler('checkCodeErrors', AIStarIconWithAnimation),
      icon: ExplainIcon,
      name: 'Check code error',
      showWhen: codeBlockShowWhen,
    },
    {
      handler: actionToHandler('explain', AIStarIconWithAnimation),
      icon: SelectionIcon,
      name: 'Explain selection',
      showWhen: textBlockShowWhen,
    },
  ],
  name: 'review with ai',
};

const GenerateWithAIGroup: AIItemGroupConfig = {
  items: [
    {
      handler: actionToHandler('summary', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Summarize',
      showWhen: textBlockShowWhen,
    },
    {
      beta: true,
      handler: actionToHandler('createHeadings', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Generate headings',
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
      handler: edgelessHandler('createImage', AIImageIconWithAnimation),
      icon: AIImageIcon,
      name: 'Generate an image',
      showWhen: textBlockShowWhen,
    },
    {
      handler: actionToHandler('writeOutline', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Generate outline',
      showWhen: textBlockShowWhen,
    },
    {
      handler: edgelessHandler('brainstormMindmap', AIPenIconWithAnimation),
      icon: AIMindMapIcon,
      name: 'Brainstorm ideas with mind map',
      showWhen: textBlockShowWhen,
    },
    {
      beta: true,
      handler: edgelessHandler('createSlides', AIPresentationIconWithAnimation),
      icon: AIPresentationIcon,
      name: 'Generate presentation',
      showWhen: textBlockShowWhen,
    },
    {
      beta: true,
      handler: edgelessHandler('makeItReal', MakeItRealIconWithAnimation),
      icon: MakeItRealIcon,
      name: 'Make it real',
      showWhen: textBlockShowWhen,
    },
    {
      beta: true,
      handler: actionToHandler('findActions', AIStarIconWithAnimation),
      icon: AISearchIcon,
      name: 'Find actions',
      showWhen: textBlockShowWhen,
    },
  ],
  name: 'generate with ai',
};

const OthersAIGroup: AIItemGroupConfig = {
  items: [
    {
      handler: host => {
        const panel = getAIPanel(host);
        AIProvider.slots.requestContinueInChat.emit({
          host: host,
          show: true,
        });
        panel.hide();
      },
      icon: ChatWithAIIcon,
      name: 'Open AI Chat',
    },
  ],
  name: 'Others',
};

export const AIItemGroups: AIItemGroupConfig[] = [
  ReviewWIthAIGroup,
  EditAIGroup,
  GenerateWithAIGroup,
  DraftAIGroup,
  OthersAIGroup,
];

export function buildAIImageItemGroups(): AIItemGroupConfig[] {
  return [
    {
      items: [
        {
          handler: actionToHandler(
            'explainImage',
            AIStarIconWithAnimation,
            undefined,
            blockActionTrackerOptions
          ),
          icon: ExplainIcon,
          name: 'Explain this image',
          showWhen: () => true,
        },
      ],
      name: 'edit with ai',
    },
    {
      items: [
        {
          handler: edgelessHandler(
            'createImage',
            AIImageIconWithAnimation,
            undefined,
            blockActionTrackerOptions
          ),
          icon: AIImageIcon,
          name: 'Generate an image',
          showWhen: () => true,
        },
        {
          beta: true,
          icon: ImproveWritingIcon,
          name: 'AI image filter',
          showWhen: () => true,
          subItem: createImageFilterSubItem(blockActionTrackerOptions),
          subItemOffset: [12, -4],
        },
        {
          beta: true,
          icon: AIImageIcon,
          name: 'Image processing',
          showWhen: () => true,
          subItem: createImageProcessingSubItem(blockActionTrackerOptions),
          subItemOffset: [12, -6],
        },
        {
          beta: true,
          handler: actionToHandler(
            'generateCaption',
            AIStarIconWithAnimation,
            undefined,
            blockActionTrackerOptions
          ),
          icon: AIPenIcon,
          name: 'Generate a caption',
          showWhen: () => true,
        },
      ],
      name: 'generate with ai',
    },
    OthersAIGroup,
  ];
}

export function buildAICodeItemGroups(): AIItemGroupConfig[] {
  return [
    {
      items: [
        {
          handler: actionToHandler(
            'explainCode',
            AIStarIconWithAnimation,
            undefined,
            blockActionTrackerOptions
          ),
          icon: ExplainIcon,
          name: 'Explain this code',
          showWhen: () => true,
        },
        {
          handler: actionToHandler(
            'checkCodeErrors',
            AIStarIconWithAnimation,
            undefined,
            blockActionTrackerOptions
          ),
          icon: ExplainIcon,
          name: 'Check code error',
          showWhen: () => true,
        },
      ],
      name: 'edit with ai',
    },
    OthersAIGroup,
  ];
}
