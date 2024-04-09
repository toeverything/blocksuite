import type { EditorHost } from '@blocksuite/block-std';
import type {
  AIItemConfig,
  AIItemGroupConfig,
  CopilotSelectionController,
  EdgelessCopilotWidget,
  EdgelessRootService,
  MindmapElementModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks';
import {
  AFFINE_AI_PANEL_WIDGET,
  AFFINE_EDGELESS_COPILOT_WIDGET,
  AffineAIPanelWidget,
  AIPenIcon,
  ChatWithAIIcon,
  ImageBlockModel,
  InsertBelowIcon,
  MakeItRealIcon,
  NoteBlockModel,
  TextElementModel,
} from '@blocksuite/blocks';
import { assertExists, assertType } from '@blocksuite/global/utils';

import { createMindmapRenderer } from '../messages/mindmap.js';

function showWhen(
  host: EditorHost,
  check: (service: EdgelessRootService) => boolean
) {
  const edgelessService = host.spec.getService(
    'affine:page'
  ) as EdgelessRootService;

  return check(edgelessService);
}

function getService(host: EditorHost) {
  const edgelessService = host.spec.getService(
    'affine:page'
  ) as EdgelessRootService;

  return edgelessService;
}

function getSelectedElements(service: EdgelessRootService) {
  return (service.tool.controllers['copilot'] as CopilotSelectionController)
    .selectedElements;
}

const createMediaPost: AIItemConfig = {
  name: 'Create a social media post',
  icon: AIPenIcon,
  showWhen: (_, editorMode, host) => {
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
  showWhen: (_, editorMode, host: EditorHost) => {
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
  showWhen: (_, editorMode, host: EditorHost) => {
    return (
      editorMode === 'edgeless' &&
      showWhen(host, service => {
        const selected = getSelectedElements(service);

        return (
          selected.length === 0 ||
          selected[0] instanceof ImageBlockModel ||
          selected[0] instanceof TextElementModel
        );
      })
    );
  },
  handler: host => {
    const rootBlockId = host.doc.root?.id;
    assertExists(rootBlockId);

    const aiPanel = host.view.getWidget(AFFINE_AI_PANEL_WIDGET, rootBlockId);
    const copilotPanel = host.view.getWidget(
      AFFINE_EDGELESS_COPILOT_WIDGET,
      rootBlockId
    );
    const selectedElement = getSelectedElements(getService(host))[0];

    if (!(aiPanel instanceof AffineAIPanelWidget) || !selectedElement) return;

    assertType<EdgelessCopilotWidget>(copilotPanel);
    copilotPanel.hide();

    const selectionRect = copilotPanel.selectionModelRect;

    aiPanel.config = {
      answerRenderer: createMindmapRenderer(host, aiPanel),
      generateAnswer: () => {},

      finishStateConfig: {
        responses: [
          {
            name: 'Insert',
            icon: InsertBelowIcon,
            handler: () => {
              const [surface] = host.doc.getBlockByFlavour('affine:surface');

              assertType<SurfaceBlockModel>(surface);

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = aiPanel.ctx as any;
              aiPanel.hide();

              const mindmapId = surface.addElement({
                type: 'mindmap',
                children: data.node,
                style: data.style,
              });
              const mindmap = surface.getElementById(
                mindmapId
              ) as MindmapElementModel;

              host.doc.transact(() => {
                const rootElement = mindmap.tree.element;

                if (selectionRect) {
                  rootElement.xywh = `[${selectionRect.x},${selectionRect.y},${rootElement.w},${rootElement.h}]`;
                }
              });
            },
          },
        ],
        actions: [],
      },
      errorStateConfig: {
        upgrade: () => {},
        responses: [],
      },
    };

    aiPanel.toggle(
      (copilotPanel as EdgelessCopilotWidget)['_selectionRectEl'],
      `Use the nested unordered list syntax without other extra text style in Markdown to create a structure similar to a mind map without any unnecessary plain text description.
    Analyze the following questions or topics: "${(selectedElement as TextElementModel).text.toString()}"`
    );
  },
};

const createPresentation: AIItemConfig = {
  name: 'Create a presentation',
  icon: AIPenIcon,
  showWhen: (_, editorMode, host: EditorHost) => {
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
  showWhen: (_, editorMode, host: EditorHost) => {
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
  showWhen: (_, editorMode, host: EditorHost) => {
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
  showWhen: (_, editorMode, host: EditorHost) => {
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
  showWhen: (_, editorMode, host: EditorHost) => {
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
  showWhen: (_, editorMode, host: EditorHost) => {
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

export const draftWithAI = {
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
  name: 'Chat with ai',
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
