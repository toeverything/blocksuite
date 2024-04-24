import type { AIItemGroupConfig, ShapeElementModel } from '@blocksuite/blocks';
import {
  AIPenIcon,
  BlocksUtils,
  LanguageIcon,
  MindmapElementModel,
  TextElementModel,
} from '@blocksuite/blocks';

import {
  actionToHandler,
  explainImageShowWhen,
  makeItRealShowWhen,
  mindmapRootShowWhen,
  mindmapShowWhen,
  noteBlockOrTextShowWhen,
} from '../../actions/edgeless-handler.js';
import { getCopilotSelectedElems } from '../../actions/edgeless-response.js';
import { translateLangs } from '../../actions/types.js';
import { getAIPanel } from '../../ai-panel.js';
import { mindMapToMarkdown } from '../../utils/edgeless.js';
import { getEdgelessRootFromEditor } from '../../utils/selection-utils.js';

const translateSubItem = translateLangs.map(lang => {
  return {
    type: lang,
    handler: actionToHandler('translate', { lang }),
  };
});

export const docGroup: AIItemGroupConfig = {
  name: 'doc with ai',
  items: [
    {
      name: 'Summary',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('summary'),
    },
  ],
};

export const othersGroup: AIItemGroupConfig = {
  name: 'others',
  items: [
    {
      name: 'Find actions from it',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('findActions'),
    },
    {
      name: 'Explain this',
      icon: AIPenIcon,
      showWhen: explainImageShowWhen,
      handler: actionToHandler('explain'),
    },
  ],
};

export const editGroup: AIItemGroupConfig = {
  name: 'edit with ai',
  items: [
    {
      name: 'Translate to',
      icon: LanguageIcon,
      showWhen: noteBlockOrTextShowWhen,
      subItem: translateSubItem,
    },
    {
      name: 'Improve writing for it',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('improveWriting'),
    },
    {
      name: 'Improve grammar for it',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('improveGrammar'),
    },
    {
      name: 'Fix spelling ',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('fixSpelling'),
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
  ],
};

export const draftGroup: AIItemGroupConfig = {
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
      name: 'Write a outline from this',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('writeOutline'),
    },
    {
      name: 'Brainstorm ideas about this',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('brainstorm'),
    },
  ],
};

export const mindmapGroup: AIItemGroupConfig = {
  name: 'mindmap with ai',
  items: [
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
  ],
};

export const presentationGroup: AIItemGroupConfig = {
  name: 'presentation with ai',
  items: [
    {
      name: 'Create a presentation',
      icon: AIPenIcon,
      showWhen: noteBlockOrTextShowWhen,
      handler: actionToHandler('createSlides'),
    },
  ],
};

export const createGroup: AIItemGroupConfig = {
  name: 'create with ai',
  items: [
    {
      name: 'Create an image',
      icon: AIPenIcon,
      showWhen: () => true,
      handler: actionToHandler('createImage', undefined, async host => {
        const selectedElements = getCopilotSelectedElems(host);

        // create an image from user input
        if (selectedElements.length === 0) {
          const aiPanel = getAIPanel(host);
          const content = aiPanel.inputText?.trim();
          if (!content) return;
          return {
            content,
          };
        }

        const edgelessRoot = getEdgelessRootFromEditor(host);
        const { notes, frames, shapes, images } =
          BlocksUtils.splitElements(selectedElements);

        // text to image
        if (selectedElements.length === 1) {
          let content;
          if (notes.length === 1) {
            const note = notes[0];
            content = note.text?.length && note.text.toString();
          } else if (shapes.length === 1) {
            const shape = shapes[0];
            content =
              shape instanceof TextElementModel &&
              shape.text.length &&
              shape.text.toString();
          }
          if (content) {
            return {
              content,
            };
          }
        }

        // image to image
        if (
          notes.length + frames.length + images.length + shapes.length ===
          0
        ) {
          return;
        }
        const canvas = await edgelessRoot.clipboardController.toCanvas(
          [...notes, ...frames, ...images],
          shapes,
          1
        );
        if (!canvas) return;
        const png = canvas.toDataURL('image/png', 0.843);
        if (!png) return;
        return {
          attachments: [png],
        };
      }),
    },
    {
      name: 'Make it real',
      icon: AIPenIcon,
      showWhen: makeItRealShowWhen,
      handler: actionToHandler('makeItReal', undefined, async host => {
        const selectedElements = getCopilotSelectedElems(host);
        const edgelessRoot = getEdgelessRootFromEditor(host);
        const { notes, frames, shapes, images } =
          BlocksUtils.splitElements(selectedElements);
        if (
          notes.length + frames.length + images.length + shapes.length ===
          0
        ) {
          return;
        }
        const canvas = await edgelessRoot.clipboardController.toCanvas(
          [...notes, ...frames, ...images],
          shapes,
          1
        );
        if (!canvas) return;
        const png = canvas.toDataURL('image/png', 0.843);
        if (!png) return;
        return {
          attachments: [png],
        };
      }),
    },
  ],
};
