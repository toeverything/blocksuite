import { BlocksUtils, TextElementModel } from '@blocksuite/blocks';

import { AIPenIcon, LanguageIcon } from '../../_common/icons.js';
import {
  actionToHandler,
  makeItRealShowWhen,
  mindmapShowWhen,
  noteBlockShowWen,
} from '../../actions/edgeless-handler.js';
import { getCopilotSelectedElems } from '../../actions/edgeless-response.js';
import { translateLangs } from '../../actions/types.js';
import { getEdgelessRootFromEditor } from '../../utils/selection-utils.js';
import type { AIItemGroupConfig } from '../../widgets/ai-item/types.js';

const translateSubItem = translateLangs.map(lang => {
  return {
    type: lang,
    handler: actionToHandler('translate', { lang }),
  };
});

export const docGroup: AIItemGroupConfig = {
  name: 'doc',
  items: [
    {
      name: 'Summary',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
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
      showWhen: noteBlockShowWen,
      handler: actionToHandler('findActions'),
    },
    {
      name: 'Explain this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('explain'),
    },
  ],
};

export const editGroup: AIItemGroupConfig = {
  name: 'edit',
  items: [
    {
      name: 'Translate to',
      icon: LanguageIcon,
      showWhen: noteBlockShowWen,
      subItem: translateSubItem,
    },
    {
      name: 'Improve writing for it',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('improveWriting'),
    },
    {
      name: 'Improve grammar for it',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('improveGrammar'),
    },
    {
      name: 'Fix spelling ',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('fixSpelling'),
    },
    {
      name: 'Make longer',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('makeLonger'),
    },
    {
      name: 'Make shorter',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('makeShorter'),
    },
  ],
};

export const draftGroup: AIItemGroupConfig = {
  name: 'draft',
  items: [
    {
      name: 'Write an article about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writeArticle'),
    },
    {
      name: 'Write a tweet about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writeTwitterPost'),
    },
    {
      name: 'Write a poem about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writePoem'),
    },
    {
      name: 'Write a blog post about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writeBlogPost'),
    },
    {
      name: 'Write a outline from this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('writeOutline'),
    },
    {
      name: 'Brainstorm ideas about this',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('brainstorm'),
    },
  ],
};

export const mindmapGroup: AIItemGroupConfig = {
  name: 'mindmap',
  items: [
    {
      name: 'Expand from this mindmap node',
      icon: AIPenIcon,
      showWhen: mindmapShowWhen,
      handler: actionToHandler('expandMindmap'),
    },
    {
      name: 'Brainstorm ideas with Mindmap',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('brainstormMindmap'),
    },
  ],
};

export const presentationGroup: AIItemGroupConfig = {
  name: 'presentation',
  items: [
    {
      name: 'Create a presentation',
      icon: AIPenIcon,
      showWhen: noteBlockShowWen,
      handler: actionToHandler('createSlides'),
    },
  ],
};

export const createGroup: AIItemGroupConfig = {
  name: 'create',
  items: [
    {
      name: 'Create an image',
      icon: AIPenIcon,
      showWhen: makeItRealShowWhen,
      handler: actionToHandler('createImage', undefined, async host => {
        const selectedElements = getCopilotSelectedElems(host);
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
          shapes
        );
        if (!canvas) return;
        const png = canvas.toDataURL('image/png');
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
          shapes
        );
        if (!canvas) return;
        const png = canvas.toDataURL('image/png');
        if (!png) return;
        return {
          attachments: [png],
        };
      }),
    },
  ],
};
