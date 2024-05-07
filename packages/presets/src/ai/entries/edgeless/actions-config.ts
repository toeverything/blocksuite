import {
  type AIItemGroupConfig,
  AIPenIcon,
  AISearchIcon,
  BlocksUtils,
  ChatWithAIIcon,
  ExplainIcon,
  ImageBlockModel,
  ImproveWritingIcon,
  LanguageIcon,
  LongerIcon,
  MakeItRealIcon,
  MindmapElementModel,
  SelectionIcon,
  ShapeElementModel,
  ShorterIcon,
  TextElementModel,
  ToneIcon,
} from '@blocksuite/blocks';

import {
  AIExpandMindMapIcon,
  AIImageIcon,
  AIMindMapIcon,
  AIPresentationIcon,
} from '../../_common/icons.js';
import {
  actionToHandler,
  explainImageShowWhen,
  getContentFromSelected,
  makeItRealShowWhen,
  mindmapChildShowWhen,
  mindmapRootShowWhen,
  noteBlockOrTextShowWhen,
  noteWithCodeBlockShowWen,
} from '../../actions/edgeless-handler.js';
import { getCopilotSelectedElems } from '../../actions/edgeless-response.js';
import { textTones, translateLangs } from '../../actions/types.js';
import { getAIPanel } from '../../ai-panel.js';
import { AIProvider } from '../../provider.js';
import { mindMapToMarkdown } from '../../utils/edgeless.js';
import { canvasToBlob, randomSeed } from '../../utils/image.js';
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
      icon: ToneIcon,
      showWhen: noteBlockOrTextShowWhen,
      subItem: toneSubItem,
    },
    {
      name: 'Improve writing',
      icon: ImproveWritingIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('improveWriting'),
    },

    {
      name: 'Make it longer',
      icon: LongerIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('makeLonger'),
    },
    {
      name: 'Make it shorter',
      icon: ShorterIcon,
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
      handler: actionToHandler('explainImage', undefined, async host => {
        const selectedElements = getCopilotSelectedElems(host);
        if (selectedElements.length !== 1) return;

        const imageBlock = selectedElements[0];
        if (!(imageBlock instanceof ImageBlockModel)) return;
        if (!imageBlock.sourceId) return;

        const blob = await host.doc.blob.get(imageBlock.sourceId);
        if (!blob) return;

        return {
          attachments: [blob],
        };
      }),
    },
    {
      name: 'Explain this code',
      icon: ExplainIcon,
      showWhen: noteWithCodeBlockShowWen,
      handler: actionToHandler('explainCode'),
    },
    {
      name: 'Check code error',
      icon: ExplainIcon,
      showWhen: noteWithCodeBlockShowWen,
      handler: actionToHandler('checkCodeErrors'),
    },
    {
      name: 'Explain selection',
      icon: SelectionIcon,
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
      beta: true,
    },
    {
      name: 'Generate an image',
      icon: AIImageIcon,
      showWhen: () => true,
      handler: actionToHandler('createImage', undefined, async (host, ctx) => {
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

        let content = (ctx.get()['content'] as string) || '';

        // get user input
        if (content.length === 0) {
          const aiPanel = getAIPanel(host);
          content = aiPanel.inputText?.trim() || '';
        }

        const {
          images,
          shapes,
          notes: _,
          frames: __,
        } = BlocksUtils.splitElements(selectedElements);

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
          {
            dpr: 1,
            padding: 0,
            background: 'white',
          }
        );
        if (!canvas) return;
        const png = await canvasToBlob(canvas);
        if (!png) return;
        return {
          content,
          attachments: [png],
          seed: String(randomSeed()),
        };
      }),
    },
    {
      name: 'Generate outline',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeOutline'),
    },
    {
      name: 'Expand from this mind map node',
      icon: AIExpandMindMapIcon,
      showWhen: mindmapChildShowWhen,
      handler: actionToHandler('expandMindmap', undefined, function (host) {
        const selected = getCopilotSelectedElems(host);
        const firstSelected = selected[0] as ShapeElementModel;
        const mindmap = firstSelected?.group;

        if (!(mindmap instanceof MindmapElementModel)) {
          return Promise.resolve({});
        }

        return Promise.resolve({
          input: firstSelected.text?.toString() ?? '',
          mindmap: mindMapToMarkdown(mindmap),
        });
      }),
      beta: true,
    },
    {
      name: 'Brainstorm ideas with mind map',
      icon: AIMindMapIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('brainstormMindmap'),
    },
    {
      name: 'Regenerate mind map',
      icon: AIMindMapIcon,
      showWhen: mindmapRootShowWhen,
      handler: actionToHandler('brainstormMindmap', {
        regenerate: true,
      }),
    },
    {
      name: 'Generate presentation',
      icon: AIPresentationIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('createSlides'),
      beta: true,
    },
    {
      name: 'Make it real',
      icon: MakeItRealIcon,
      beta: true,
      showWhen: makeItRealShowWhen,
      handler: actionToHandler('makeItReal', undefined, async (host, ctx) => {
        const selectedElements = getCopilotSelectedElems(host);
        const { notes, frames, shapes, images } =
          BlocksUtils.splitElements(selectedElements);
        const f = frames.length;
        const i = images.length;
        const n = notes.length;
        const s = shapes.length;

        if (f + i + n + s === 0) {
          return;
        }

        // single note, text, shape(text) or image(caption)
        if (f === 0 && n + s + i === 1) {
          const content = await getContentFromSelected(host, [
            ...notes,
            ...shapes,
            ...images,
          ]);
          if (!content) return;
          return {
            content,
          };
        }

        const edgelessRoot = getEdgelessRootFromEditor(host);
        const canvas = await edgelessRoot.clipboardController.toCanvas(
          [...notes, ...frames, ...images],
          shapes,
          {
            dpr: 1,
            background: 'white',
          }
        );
        if (!canvas) return;
        const png = await canvasToBlob(canvas);
        if (!png) return;
        ctx.set({
          width: canvas.width,
          height: canvas.height,
        });
        return {
          attachments: [png],
        };
      }),
    },
    {
      name: 'Find actions',
      icon: AISearchIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('findActions'),
      beta: true,
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
