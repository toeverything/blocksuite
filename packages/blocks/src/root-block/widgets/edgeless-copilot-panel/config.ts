import { AIPenIcon, ChatWithAIIcon } from '../../../_common/icons/ai.js';
import { ImageBlockModel } from '../../../image-block/image-model.js';
import { NoteBlockModel } from '../../../note-block/note-model.js';
import { TextElementModel } from '../../../surface-block/index.js';
import type { EdgelessModel } from '../../edgeless/type.js';

const createMediaPost = {
  name: 'Create a social media post',
  icon: AIPenIcon,
  showWhen: (selectedEls: EdgelessModel[]) => {
    return selectedEls[0] instanceof ImageBlockModel;
  },
};

const createImage = {
  name: 'Create an image',
  icon: AIPenIcon,
  showWhen: (selectedEls: EdgelessModel[]) => {
    return (
      selectedEls.length === 0 ||
      selectedEls[0] instanceof ImageBlockModel ||
      selectedEls[0] instanceof NoteBlockModel
    );
  },
};

const createMindmap = {
  name: 'Create a mindmap',
  icon: AIPenIcon,
  showWhen: (selectedEls: EdgelessModel[]) => {
    return (
      selectedEls.length === 0 ||
      selectedEls[0] instanceof ImageBlockModel ||
      selectedEls[0] instanceof NoteBlockModel
    );
  },
};

const createPresentation = {
  name: 'Create a presentation',
  icon: AIPenIcon,
  showWhen: (selectedEls: EdgelessModel[]) => {
    return selectedEls.length === 0 || selectedEls[0] instanceof NoteBlockModel;
  },
};

const createOutline = {
  name: 'Create an outline',
  icon: AIPenIcon,
  showWhen: (selectedEls: EdgelessModel[]) => {
    return (
      selectedEls[0] instanceof NoteBlockModel ||
      selectedEls[0] instanceof TextElementModel
    );
  },
};

const createStory = {
  name: 'Create creative story',
  icon: AIPenIcon,
  showWhen: (selectedEls: EdgelessModel[]) => {
    return (
      selectedEls[0] instanceof NoteBlockModel ||
      selectedEls[0] instanceof TextElementModel
    );
  },
};

const createEssay = {
  name: 'Create an essay',
  icon: AIPenIcon,
  showWhen: (selectedEls: EdgelessModel[]) => {
    return (
      selectedEls[0] instanceof NoteBlockModel ||
      selectedEls[0] instanceof TextElementModel
    );
  },
};

const createSummary = {
  name: 'Create a summary from this doc',
  icon: AIPenIcon,
  showWhen: (selectedEls: EdgelessModel[]) => {
    return (
      selectedEls[0] instanceof NoteBlockModel ||
      selectedEls[0] instanceof TextElementModel
    );
  },
};

const createCode = {
  name: 'Create a title for this doc',
  icon: AIPenIcon,
  showWhen: (selectedEls: EdgelessModel[]) => {
    return (
      selectedEls[0] instanceof NoteBlockModel ||
      selectedEls[0] instanceof TextElementModel
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
    createCode,
  ],
};

const chatWithAI = {
  name: 'Chat with ai',
  icon: ChatWithAIIcon,
  showWhen: () => true,
};

export const actionWithAI = {
  name: 'action',
  items: [chatWithAI],
};

export const editOrReviewWithAI = {
  name: 'edit or review selection',
  items: [],
};
