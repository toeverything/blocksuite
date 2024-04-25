import {
  type AIItemGroupConfig,
  AIPenIcon,
  BlocksUtils,
  ChatWithAIIcon,
  LanguageIcon,
  MindmapElementModel,
  ShapeElementModel,
  TextElementModel,
} from '@blocksuite/blocks';

import {
  actionToHandler,
  explainImageShowWhen,
  getContentFromSelected,
  makeItRealShowWhen,
  mindmapRootShowWhen,
  mindmapShowWhen,
  noteBlockOrTextShowWhen,
} from '../../actions/edgeless-handler.js';
import { getCopilotSelectedElems } from '../../actions/edgeless-response.js';
import { textTones, translateLangs } from '../../actions/types.js';
import { getAIPanel } from '../../ai-panel.js';
import { AIProvider } from '../../provider.js';
import { mindMapToMarkdown } from '../../utils/edgeless.js';
import { canvasToBlob } from '../../utils/image.js';
import { getEdgelessRootFromEditor } from '../../utils/selection-utils.js';

const translateSubItem = translateLangs.map(lang => {
  return {
    type: lang,
    handler: actionToHandler('translate', { lang }),
  };
});

const toneSubItem = textTones.map(tone => {
  return {
    type: tone,
    handler: actionToHandler('changeTone', { tone }),
  };
});

const othersGroup: AIItemGroupConfig = {
  name: 'others',
  items: [
    {
      name: 'Open AI Chat',
      icon: ChatWithAIIcon,
      showWhen: () => true,
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

const editGroup: AIItemGroupConfig = {
  name: 'edit with ai',
  items: [
    {
      name: 'Translate to',
      icon: LanguageIcon,
      showWhen: noteBlockOrTextShowWhen,
      subItem: translateSubItem,
    },
    {
      name: 'Change tone to',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      subItem: toneSubItem,
    },
    {
      name: 'Improve writing',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('improveWriting'),
    },

    {
      name: 'Make longer',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('makeLonger'),
    },
    {
      name: 'Make shorter',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('makeShorter'),
    },
    {
      name: 'Continue writing',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('continueWriting'),
    },
  ],
};

const draftGroup: AIItemGroupConfig = {
  name: 'draft with ai',
  items: [
    {
      name: 'Write an article about this',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeArticle'),
    },
    {
      name: 'Write a tweet about this',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeTwitterPost'),
    },
    {
      name: 'Write a poem about this',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writePoem'),
    },
    {
      name: 'Write a blog post about this',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeBlogPost'),
    },
    {
      name: 'Brainstorm ideas about this',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('brainstorm'),
    },
  ],
};

const reviewGroup: AIItemGroupConfig = {
  name: 'review with ai',
  items: [
    {
      name: 'Fix spelling',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('fixSpelling'),
    },
    {
      name: 'Fix grammar',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('improveGrammar'),
    },
    {
      name: 'Explain this image',
      icon: AIPenIcon,
      showWhen: explainImageShowWhen,
      handler: actionToHandler('explainImage'),
    },
    {
      name: 'Explain this code',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('explainCode'),
    },
    {
      name: 'Check code error',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('checkCodeErrors'),
    },
    {
      name: 'Explain selection',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('explain'),
    },
  ],
};

const generateGroup: AIItemGroupConfig = {
  name: 'generate with ai',
  items: [
    {
      name: 'Summarize',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('summary'),
    },
    {
      name: 'Generate headings',
      icon: AIPenIcon,
      handler: actionToHandler('createHeadings'),
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      name: 'Generate outline',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeOutline'),
    },
    {
      name: 'Find actions',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('findActions'),
    },
    {
      name: 'Generate an image',
      icon: AIPenIcon,
      showWhen: () => true,
      handler: actionToHandler('createImage', undefined, async host => {
        const selectedElements = getCopilotSelectedElems(host);
        const len = selectedElements.length;

        // text to image
        // create an image from user input
        if (len === 0) {
          const aiPanel = getAIPanel(host);
          const content = aiPanel.inputText?.trim();
          if (!content) return;
          return {
            content,
          };
        }

        const {
          notes,
          images,
          shapes,
          frames: _,
        } = BlocksUtils.splitElements(selectedElements);

        const content = (
          await getContentFromSelected(host, [...notes, ...shapes])
        ).trim();

        const pureShapes = shapes.filter(
          e =>
            !(
              e instanceof TextElementModel ||
              (e instanceof ShapeElementModel && e.text?.length)
            )
        );

        // text to image
        if (content.length && images.length + pureShapes.length === 0) {
          return {
            content,
          };
        }

        // image to image
        const edgelessRoot = getEdgelessRootFromEditor(host);
        const canvas = await edgelessRoot.clipboardController.toCanvas(
          images,
          pureShapes,
          1
        );
        if (!canvas) return;
        const png = await canvasToBlob(canvas);
        if (!png) return;
        return {
          content,
          attachments: [png],
        };
      }),
    },
    {
      name: 'Expand from this mind map node',
      icon: AIPenIcon,
      showWhen: mindmapShowWhen,
      handler: actionToHandler('expandMindmap', undefined, function (host) {
        const selected = getCopilotSelectedElems(host);
        const firstSelected = selected[0] as ShapeElementModel;
        const mindmap = firstSelected?.group;

        if (!(mindmap instanceof MindmapElementModel)) {
          return Promise.resolve({});
        }

        return Promise.resolve({
          input: firstSelected.text?.toString() ?? '',
          content: mindMapToMarkdown(mindmap),
        });
      }),
    },
    {
      name: 'Brainstorm ideas with mind map',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('brainstormMindmap'),
    },

    {
      name: 'Regenerate mind map',
      icon: AIPenIcon,
      showWhen: mindmapRootShowWhen,
      handler: actionToHandler('brainstormMindmap'),
    },
    {
      name: 'Generate presentation',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('createSlides'),
    },

    {
      name: 'Make it real',
      icon: AIPenIcon,
      showWhen: makeItRealShowWhen,
      handler: actionToHandler('makeItReal', undefined, async host => {
        const selectedElements = getCopilotSelectedElems(host);
        const { notes, frames, shapes, images } =
          BlocksUtils.splitElements(selectedElements);
        if (
          notes.length + frames.length + images.length + shapes.length ===
          0
        ) {
          return;
        }
        const edgelessRoot = getEdgelessRootFromEditor(host);
        const canvas = await edgelessRoot.clipboardController.toCanvas(
          [...notes, ...frames, ...images],
          shapes,
          1
        );
        if (!canvas) return;
        const png = await canvasToBlob(canvas);
        if (!png) return;
        return {
          attachments: [png],
        };
      }),
    },
  ],
};

export const edgelessActionGroups = [
  reviewGroup,
  editGroup,
  generateGroup,
  draftGroup,
  othersGroup,
];
