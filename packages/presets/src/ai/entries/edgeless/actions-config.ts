import {
  type AIItemGroupConfig,
  AIStarIconWithAnimation,
  BlocksUtils,
  MindmapElementModel,
  ShapeElementModel,
  TextElementModel,
} from '@blocksuite/blocks';

import {
  AIExpandMindMapIcon,
  AIImageIcon,
  AIImageIconWithAnimation,
  AIMindMapIcon,
  AIMindMapIconWithAnimation,
  AIPenIcon,
  AIPenIconWithAnimation,
  AIPresentationIcon,
  AIPresentationIconWithAnimation,
  AISearchIcon,
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
} from '../../_common/icons.js';
import {
  actionToHandler,
  imageOnlyShowWhen,
  mindmapChildShowWhen,
  mindmapRootShowWhen,
  noteBlockOrTextShowWhen,
  noteWithCodeBlockShowWen,
} from '../../actions/edgeless-handler.js';
import {
  imageFilterStyles,
  imageProcessingTypes,
  textTones,
  translateLangs,
} from '../../actions/types.js';
import { getAIPanel } from '../../ai-panel.js';
import { AIProvider } from '../../provider.js';
import { mindMapToMarkdown } from '../../utils/edgeless.js';
import { canvasToBlob, randomSeed } from '../../utils/image.js';
import {
  getCopilotSelectedElems,
  getEdgelessRootFromEditor,
  imageCustomInput,
} from '../../utils/selection-utils.js';

const translateSubItem = translateLangs.map(lang => {
  return {
    handler: actionToHandler('translate', AIStarIconWithAnimation, { lang }),
    type: lang,
  };
});

const toneSubItem = textTones.map(tone => {
  return {
    handler: actionToHandler('changeTone', AIStarIconWithAnimation, { tone }),
    type: tone,
  };
});

export const imageFilterSubItem = imageFilterStyles.map(style => {
  return {
    handler: actionToHandler(
      'filterImage',
      AIImageIconWithAnimation,
      {
        style,
      },
      imageCustomInput
    ),
    type: style,
  };
});

export const imageProcessingSubItem = imageProcessingTypes.map(type => {
  return {
    handler: actionToHandler(
      'processImage',
      AIImageIconWithAnimation,
      {
        type,
      },
      imageCustomInput
    ),
    type,
  };
});

const othersGroup: AIItemGroupConfig = {
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
      showWhen: () => true,
    },
  ],
  name: 'others',
};

const editGroup: AIItemGroupConfig = {
  items: [
    {
      icon: LanguageIcon,
      name: 'Translate to',
      showWhen: noteBlockOrTextShowWhen,
      subItem: translateSubItem,
    },
    {
      icon: ToneIcon,
      name: 'Change tone to',
      showWhen: noteBlockOrTextShowWhen,
      subItem: toneSubItem,
    },
    {
      handler: actionToHandler('improveWriting', AIStarIconWithAnimation),
      icon: ImproveWritingIcon,
      name: 'Improve writing',
      showWhen: noteBlockOrTextShowWhen,
    },

    {
      handler: actionToHandler('makeLonger', AIStarIconWithAnimation),
      icon: LongerIcon,
      name: 'Make it longer',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler('makeShorter', AIStarIconWithAnimation),
      icon: ShorterIcon,
      name: 'Make it shorter',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler('continueWriting', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Continue writing',
      showWhen: noteBlockOrTextShowWhen,
    },
  ],
  name: 'edit with ai',
};

const draftGroup: AIItemGroupConfig = {
  items: [
    {
      handler: actionToHandler('writeArticle', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Write an article about this',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler('writeTwitterPost', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Write a tweet about this',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler('writePoem', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Write a poem about this',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler('writeBlogPost', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Write a blog post about this',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler('brainstorm', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Brainstorm ideas about this',
      showWhen: noteBlockOrTextShowWhen,
    },
  ],
  name: 'draft with ai',
};

const reviewGroup: AIItemGroupConfig = {
  items: [
    {
      handler: actionToHandler('fixSpelling', AIStarIconWithAnimation),
      icon: AIPenIcon,
      name: 'Fix spelling',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler('improveGrammar', AIStarIconWithAnimation),
      icon: AIPenIcon,
      name: 'Fix grammar',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler(
        'explainImage',
        AIStarIconWithAnimation,
        undefined,
        imageCustomInput
      ),
      icon: AIPenIcon,
      name: 'Explain this image',
      showWhen: imageOnlyShowWhen,
    },
    {
      handler: actionToHandler('explainCode', AIStarIconWithAnimation),
      icon: ExplainIcon,
      name: 'Explain this code',
      showWhen: noteWithCodeBlockShowWen,
    },
    {
      handler: actionToHandler('checkCodeErrors', AIStarIconWithAnimation),
      icon: ExplainIcon,
      name: 'Check code error',
      showWhen: noteWithCodeBlockShowWen,
    },
    {
      handler: actionToHandler('explain', AIStarIconWithAnimation),
      icon: SelectionIcon,
      name: 'Explain selection',
      showWhen: noteBlockOrTextShowWhen,
    },
  ],
  name: 'review with ai',
};

const generateGroup: AIItemGroupConfig = {
  items: [
    {
      handler: actionToHandler('summary', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Summarize',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      beta: true,
      handler: actionToHandler('createHeadings', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Generate headings',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler(
        'createImage',
        AIImageIconWithAnimation,
        undefined,
        async (host, ctx) => {
          const selectedElements = getCopilotSelectedElems(host);
          const len = selectedElements.length;

          const aiPanel = getAIPanel(host);
          // text to image
          // from user input
          if (len === 0) {
            const content = aiPanel.inputText?.trim();
            if (!content) return;
            return {
              content,
            };
          }

          let content = (ctx.get()['content'] as string) || '';

          // from user input
          if (content.length === 0) {
            content = aiPanel.inputText?.trim() || '';
          }

          const {
            frames: __,
            images,
            notes: _,
            shapes,
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
              background: 'white',
              dpr: 1,
              padding: 0,
            }
          );
          if (!canvas) return;

          const png = await canvasToBlob(canvas);
          if (!png) return;
          return {
            attachments: [png],
            content,
            seed: String(randomSeed()),
          };
        }
      ),
      icon: AIImageIcon,
      name: 'Generate an image',
      showWhen: () => true,
    },
    {
      handler: actionToHandler('writeOutline', AIPenIconWithAnimation),
      icon: AIPenIcon,
      name: 'Generate outline',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      beta: true,
      handler: actionToHandler(
        'expandMindmap',
        AIMindMapIconWithAnimation,
        undefined,
        function (host) {
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
        }
      ),
      icon: AIExpandMindMapIcon,
      name: 'Expand from this mind map node',
      showWhen: mindmapChildShowWhen,
    },
    {
      handler: actionToHandler('brainstormMindmap', AIMindMapIconWithAnimation),
      icon: AIMindMapIcon,
      name: 'Brainstorm ideas with mind map',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      handler: actionToHandler(
        'brainstormMindmap',
        AIMindMapIconWithAnimation,
        {
          regenerate: true,
        }
      ),
      icon: AIMindMapIcon,
      name: 'Regenerate mind map',
      showWhen: mindmapRootShowWhen,
    },
    {
      beta: true,
      handler: actionToHandler('createSlides', AIPresentationIconWithAnimation),
      icon: AIPresentationIcon,
      name: 'Generate presentation',
      showWhen: noteBlockOrTextShowWhen,
    },
    {
      beta: true,
      handler: actionToHandler(
        'makeItReal',
        MakeItRealIconWithAnimation,
        undefined,
        async (host, ctx) => {
          const selectedElements = getCopilotSelectedElems(host);

          // from user input
          if (selectedElements.length === 0) {
            const aiPanel = getAIPanel(host);
            const content = aiPanel.inputText?.trim();
            if (!content) return;
            return {
              content,
            };
          }

          const { edgelessTexts, frames, images, notes, shapes } =
            BlocksUtils.splitElements(selectedElements);
          const f = frames.length;
          const i = images.length;
          const n = notes.length;
          const s = shapes.length;
          const e = edgelessTexts.length;

          if (f + i + n + s + e === 0) {
            return;
          }

          let content = (ctx.get()['content'] as string) || '';

          // single note, text, edgeless text
          if (i === 0 && n + s + e === 1) {
            if (
              n === 1 ||
              e === 1 ||
              (s === 1 && shapes[0] instanceof TextElementModel)
            ) {
              return {
                content,
              };
            }
          }

          // from user input
          if (content.length === 0) {
            const aiPanel = getAIPanel(host);
            content = aiPanel.inputText?.trim() || '';
          }

          const edgelessRoot = getEdgelessRootFromEditor(host);
          const canvas = await edgelessRoot.clipboardController.toCanvas(
            [...notes, ...frames, ...images],
            shapes,
            {
              background: 'white',
              dpr: 1,
            }
          );
          if (!canvas) return;
          const png = await canvasToBlob(canvas);
          if (!png) return;
          ctx.set({
            height: canvas.height,
            width: canvas.width,
          });

          return {
            attachments: [png],
            content,
          };
        }
      ),
      icon: MakeItRealIcon,
      name: 'Make it real',
      showWhen: () => true,
    },
    {
      beta: true,
      icon: ImproveWritingIcon,
      name: 'AI image filter',
      showWhen: imageOnlyShowWhen,
      subItem: imageFilterSubItem,
      subItemOffset: [12, -4],
    },
    {
      beta: true,
      icon: AIImageIcon,
      name: 'Image processing',
      showWhen: imageOnlyShowWhen,
      subItem: imageProcessingSubItem,
      subItemOffset: [12, -6],
    },
    {
      beta: true,
      handler: actionToHandler(
        'generateCaption',
        AIStarIconWithAnimation,
        undefined,
        imageCustomInput
      ),
      icon: AIPenIcon,
      name: 'Generate a caption',
      showWhen: imageOnlyShowWhen,
    },
    {
      beta: true,
      handler: actionToHandler('findActions', AIStarIconWithAnimation),
      icon: AISearchIcon,
      name: 'Find actions',
      showWhen: noteBlockOrTextShowWhen,
    },
  ],
  name: 'generate with ai',
};

export const edgelessActionGroups = [
  reviewGroup,
  editGroup,
  generateGroup,
  draftGroup,
  othersGroup,
];
