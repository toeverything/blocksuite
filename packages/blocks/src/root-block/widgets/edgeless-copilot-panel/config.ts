import type { EditorHost } from '@blocksuite/block-std';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import type { AIItemConfig } from '../../../_common/components/ai-item/types.js';
import {
  AIPenIcon,
  ChatWithAIIcon,
  MakeItRealIcon,
} from '../../../_common/icons/ai.js';
import type { EditorMode } from '../../../_common/types.js';
import { ImageBlockModel } from '../../../image-block/image-model.js';
import { NoteBlockModel } from '../../../note-block/note-model.js';
import type { EdgelessRootService } from '../../../root-block/edgeless/edgeless-root-service.js';
import { TextElementModel } from '../../../surface-block/index.js';
import type { CopilotSelectionController } from '../../edgeless/controllers/tools/copilot-tool.js';

function showWhen(
  host: EditorHost,
  check: (service: EdgelessRootService) => boolean
) {
  const edgelessService = host.spec.getService(
    'affine:page'
  ) as EdgelessRootService;

  return check(edgelessService);
}

function getSelectedElements(service: EdgelessRootService) {
  return (service.tool.controllers['copilot'] as CopilotSelectionController)
    .selectedElements;
}

const createMediaPost: AIItemConfig = {
  name: 'Create a social media post',
  icon: AIPenIcon,
  showWhen: (_, editorMode: EditorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected[0] instanceof ImageBlockModel ||
          selected[0] instanceof NoteBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
};

const createImage: AIItemConfig = {
  name: 'Create an image',
  icon: AIPenIcon,
  showWhen: (_, editorMode: EditorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected.length === 0 ||
          selected[0] instanceof ImageBlockModel ||
          selected[0] instanceof NoteBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
};

const createMindmap: AIItemConfig = {
  name: 'Create a mindmap',
  icon: AIPenIcon,
  showWhen: (_, editorMode: EditorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected.length === 0 ||
          selected[0] instanceof ImageBlockModel ||
          selected[0] instanceof NoteBlockModel
        );
      })
    );
  },
};

const createPresentation: AIItemConfig = {
  name: 'Create a presentation',
  icon: AIPenIcon,
  showWhen: (_, editorMode: EditorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected.length === 0 ||
          selected[0] instanceof NoteBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
};

const createOutline: AIItemConfig = {
  name: 'Create an outline',
  icon: AIPenIcon,
  showWhen: (_, editorMode: EditorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected[0] instanceof NoteBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
};

const createStory: AIItemConfig = {
  name: 'Create creative story',
  icon: AIPenIcon,
  showWhen: (_, editorMode: EditorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected[0] instanceof NoteBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
};

const createEssay: AIItemConfig = {
  name: 'Create an essay',
  icon: AIPenIcon,
  showWhen: (_, editorMode: EditorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected[0] instanceof NoteBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
};

const createSummary: AIItemConfig = {
  name: 'Create a summary from this doc',
  icon: AIPenIcon,
  showWhen: (_, editorMode: EditorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected[0] instanceof NoteBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
};

const createTitle: AIItemConfig = {
  name: 'Create a title for this doc',
  icon: AIPenIcon,
  showWhen: (_, editorMode: EditorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected[0] instanceof NoteBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
};

export const dragWithAI = {
  name: 'draft with ai',
  items: [
    createMediaPost,
    createImage,
    createMindmap,
    createPresentation,
    createOutline,
    createStory,
    createEssay,
    createSummary,
    createTitle,
  ],
} as AIItemGroupConfig;

const chatWithAI: AIItemConfig = {
  name: 'Open AI Chat',
  icon: ChatWithAIIcon,
  showWhen: () => true,
};

const makeItReal: AIItemConfig = {
  name: 'Make it real',
  icon: MakeItRealIcon,
  showWhen: () => true,
};

export const actionWithAI = {
  name: 'action',
  items: [chatWithAI, makeItReal],
};
