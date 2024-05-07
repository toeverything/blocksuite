import type { Chain, EditorHost, InitCommandCtx } from '@blocksuite/block-std';
import type {
  CopilotSelectionController,
  EdgelessElementToolbarWidget,
} from '@blocksuite/blocks';
import {
  AIDoneIcon,
  type AIItemGroupConfig,
  AIPenIcon,
  AISearchIcon,
  type AISubItemConfig,
  ChatWithAIIcon,
  EDGELESS_ELEMENT_TOOLBAR_WIDGET,
  ExplainIcon,
  ImproveWritingIcon,
  LanguageIcon,
  LongerIcon,
  matchFlavours,
  SelectionIcon,
  ShorterIcon,
  ToneIcon,
} from '@blocksuite/blocks';

import {
  AIImageIcon,
  AIMindMapIcon,
  AIPresentationIcon,
} from '../../_common/icons.js';
import { actionToHandler } from '../../actions/doc-handler.js';
import { actionToHandler as edgelessActionToHandler } from '../../actions/edgeless-handler.js';
import { textTones, translateLangs } from '../../actions/types.js';
import { getAIPanel } from '../../ai-panel.js';
import { AIProvider } from '../../provider.js';
import {
  getSelectedImagesAsBlobs,
  getSelectedTextContent,
  getSelections,
} from '../../utils/selection-utils.js';

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
      name: 'Make it longer',
      icon: LongerIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('makeLonger'),
    },
    {
      name: 'Make it shorter',
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
  ],
};

// actions that initiated from a note in edgeless mode
// 1. when running in doc mode, call requestRunInEdgeless (let affine to show toast)
// 2. when running in edgeless mode
//    a. get selected in the note and let the edgeless action to handle it
//    b. insert the result using the note shape
function edgelessHandler<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >
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
      const selectedElements = edgeless.service.selection.elements;
      currentController.updateDragPointsWith(selectedElements, 10);
      currentController.draggingAreaUpdated.emit(false); // do not show edgeless panel

      return edgelessActionToHandler(id, variants, async () => {
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
      })(host);
    }
  };
}

const ReviewWIthAIGroup: AIItemGroupConfig = {
  name: 'review with ai',
  items: [
    {
      name: 'Fix spelling',
      icon: AIDoneIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('fixSpelling'),
    },
    {
      name: 'Fix grammar',
      icon: AIDoneIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('improveGrammar'),
    },
    {
      name: 'Explain this image',
      icon: AIPenIcon,
      showWhen: imageBlockShowWhen,
      handler: actionToHandler('explainImage'),
    },
    {
      name: 'Explain this code',
      icon: ExplainIcon,
      showWhen: codeBlockShowWhen,
      handler: actionToHandler('explainCode'),
    },
    {
      name: 'Check code error',
      icon: ExplainIcon,
      showWhen: codeBlockShowWhen,
      handler: actionToHandler('checkCodeErrors'),
    },
    {
      name: 'Explain selection',
      icon: SelectionIcon,
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
      name: 'Generate headings',
      icon: AIPenIcon,
      beta: true,
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
      name: 'Generate an image',
      icon: AIImageIcon,
      showWhen: textBlockShowWhen,
      handler: edgelessHandler('createImage'),
    },
    {
      name: 'Generate outline',
      icon: AIPenIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('writeOutline'),
    },
    {
      name: 'Brainstorm ideas with mind map',
      icon: AIMindMapIcon,
      showWhen: textBlockShowWhen,
      handler: edgelessHandler('brainstormMindmap'),
    },
    {
      name: 'Generate presentation',
      icon: AIPresentationIcon,
      showWhen: textBlockShowWhen,
      handler: edgelessHandler('createSlides'),
      beta: true,
    },
    {
      name: 'Find actions',
      icon: AISearchIcon,
      showWhen: textBlockShowWhen,
      handler: actionToHandler('findActions'),
      beta: true,
    },
  ],
};

const OthersAIGroup: AIItemGroupConfig = {
  name: 'Others',
  items: [
    {
      name: 'Open AI Chat',
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
  ReviewWIthAIGroup,
  EditAIGroup,
  GenerateWithAIGroup,
  DraftAIGroup,
  OthersAIGroup,
];
