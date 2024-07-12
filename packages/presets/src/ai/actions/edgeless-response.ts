import type { EditorHost } from '@blocksuite/block-std';
import type {
  AIItemConfig,
  AffineAIPanelWidget,
  EdgelessCopilotWidget,
  EdgelessElementToolbarWidget,
  EdgelessRootService,
  MindmapElementModel,
  ShapeElementModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks';
import type { TemplateResult } from 'lit';

import {
  DeleteIcon,
  EDGELESS_ELEMENT_TOOLBAR_WIDGET,
  EmbedHtmlBlockSpec,
  ImageBlockModel,
  InsertBelowIcon,
  NoteDisplayMode,
  ResetIcon,
  fitContent,
} from '@blocksuite/blocks';

import type { CtxRecord } from './types.js';

import { AIPenIcon, ChatWithAIIcon } from '../_common/icons.js';
import { insertFromMarkdown } from '../_common/markdown-utils.js';
import { getSurfaceElementFromEditor } from '../_common/selection-utils.js';
import { getAIPanel } from '../ai-panel.js';
import { AIProvider } from '../provider.js';
import { reportResponse } from '../utils/action-reporter.js';
import {
  getEdgelessCopilotWidget,
  getService,
  isMindMapRoot,
} from '../utils/edgeless.js';
import { preprocessHtml } from '../utils/html.js';
import { fetchImageToFile } from '../utils/image.js';
import {
  getCopilotSelectedElems,
  getEdgelessRootFromEditor,
  getEdgelessService,
} from '../utils/selection-utils.js';
import { EXCLUDING_INSERT_ACTIONS, generatingStages } from './consts.js';

type FinishConfig = Exclude<
  AffineAIPanelWidget['config'],
  null
>['finishStateConfig'];

type ErrorConfig = Exclude<
  AffineAIPanelWidget['config'],
  null
>['errorStateConfig'];

export function getElementToolbar(
  host: EditorHost
): EdgelessElementToolbarWidget {
  const rootBlockId = host.doc.root?.id as string;
  const elementToolbar = host.view.getWidget(
    EDGELESS_ELEMENT_TOOLBAR_WIDGET,
    rootBlockId
  ) as EdgelessElementToolbarWidget;

  return elementToolbar;
}

export function getTriggerEntry(host: EditorHost) {
  const copilotWidget = getEdgelessCopilotWidget(host);

  return copilotWidget.visible ? 'selection' : 'toolbar';
}

export function discard(
  panel: AffineAIPanelWidget,
  _: EdgelessCopilotWidget
): AIItemConfig {
  return {
    handler: () => {
      panel.discard();
    },
    icon: DeleteIcon,
    name: 'Discard',
    showWhen: () => !!panel.answer,
  };
}

export function retry(panel: AffineAIPanelWidget): AIItemConfig {
  return {
    handler: () => {
      reportResponse('result:retry');
      panel.generate();
    },
    icon: ResetIcon,
    name: 'Retry',
  };
}

export function createInsertResp<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  handler: (host: EditorHost, ctx: CtxRecord) => void,
  host: EditorHost,
  ctx: CtxRecord,
  buttonText: string = 'Insert below'
): AIItemConfig {
  return {
    handler: () => {
      reportResponse('result:insert');
      handler(host, ctx);
      const panel = getAIPanel(host);
      panel.hide();
    },
    icon: InsertBelowIcon,
    name: buttonText,
    showWhen: () => {
      const panel = getAIPanel(host);
      return !EXCLUDING_INSERT_ACTIONS.includes(id) && !!panel.answer;
    },
  };
}

export function useAsCaption<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  host: EditorHost
): AIItemConfig {
  return {
    handler: () => {
      reportResponse('result:use-as-caption');
      const panel = getAIPanel(host);
      const caption = panel.answer;
      if (!caption) return;

      const selectedElements = getCopilotSelectedElems(host);
      if (selectedElements.length !== 1) return;

      const imageBlock = selectedElements[0];
      if (!(imageBlock instanceof ImageBlockModel)) return;

      host.doc.updateBlock(imageBlock, { caption });
      panel.hide();
    },
    icon: AIPenIcon,
    name: 'Use as caption',
    showWhen: () => {
      const panel = getAIPanel(host);
      return id === 'generateCaption' && !!panel.answer;
    },
  };
}

type MindMapNode = {
  children: MindMapNode[];
  text: string;
};

const defaultHandler = (host: EditorHost) => {
  const doc = host.doc;
  const panel = getAIPanel(host);
  const edgelessCopilot = getEdgelessCopilotWidget(host);
  const bounds = edgelessCopilot.determineInsertionBounds(800, 95);

  doc.transact(() => {
    const noteBlockId = doc.addBlock(
      'affine:note',
      {
        displayMode: NoteDisplayMode.EdgelessOnly,
        xywh: bounds.serialize(),
      },
      doc.root!.id
    );

    insertFromMarkdown(host, panel.answer!, noteBlockId)
      .then(() => {
        const service = getService(host);

        service.selection.set({
          editing: false,
          elements: [noteBlockId],
        });
      })
      .catch(err => {
        console.error(err);
      });
  });
};

const imageHandler = (host: EditorHost) => {
  const aiPanel = getAIPanel(host);
  // `DataURL` or `URL`
  const data = aiPanel.answer;
  if (!data) return;

  const edgelessCopilot = getEdgelessCopilotWidget(host);
  const bounds = edgelessCopilot.determineInsertionBounds();

  edgelessCopilot.hideCopilotPanel();
  aiPanel.hide();

  const filename = 'image';
  const imageProxy = host.std.clipboard.configs.get('imageProxy');

  fetchImageToFile(data, filename, imageProxy)
    .then(img => {
      if (!img) return;

      const edgelessRoot = getEdgelessRootFromEditor(host);
      const { minX, minY } = bounds;
      const [x, y] = edgelessRoot.service.viewport.toViewCoord(minX, minY);

      host.doc.transact(() => {
        edgelessRoot.addImages([img], [x, y], true).catch(console.error);
      });
    })
    .catch(console.error);
};

export const responses: {
  [key in keyof Partial<BlockSuitePresets.AIActions>]: (
    host: EditorHost,
    ctx: CtxRecord
  ) => void;
} = {
  brainstormMindmap: (host, ctx) => {
    const aiPanel = getAIPanel(host);
    const edgelessService = getEdgelessService(host);
    const edgelessCopilot = getEdgelessCopilotWidget(host);
    const selectionRect = edgelessCopilot.selectionModelRect;
    const [surface] = host.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];
    const elements = ctx.get()[
      'selectedElements'
    ] as BlockSuite.EdgelessModelType[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = ctx.get() as any;
    let newGenerated = true;

    // This means regenerate
    if (isMindMapRoot(elements[0])) {
      const mindmap = elements[0].group as MindmapElementModel;
      const xywh = mindmap.tree.element.xywh;

      surface.removeElement(mindmap.id);

      if (data.node) {
        data.node.xywh = xywh;
        newGenerated = false;
      }
    }

    edgelessCopilot.hideCopilotPanel();
    aiPanel.hide();

    const mindmapId = surface.addElement({
      children: data.node,
      style: data.style,
      type: 'mindmap',
    });

    edgelessService.telemetryService?.track('CanvasElementAdded', {
      control: 'ai',
      module: 'toolbar',
      page: 'whiteboard editor',
      segment: 'toolbar',
      type: 'mindmap',
    });

    const mindmap = surface.getElementById(mindmapId) as MindmapElementModel;

    host.doc.transact(() => {
      mindmap.childElements.forEach(shape => {
        fitContent(shape as ShapeElementModel);
      });
    });

    queueMicrotask(() => {
      if (newGenerated && selectionRect) {
        mindmap.moveTo([
          selectionRect.x,
          selectionRect.y,
          selectionRect.width,
          selectionRect.height,
        ]);
      }
    });

    // This is a workaround to make sure mindmap and other microtask are done
    setTimeout(() => {
      edgelessService.viewport.setViewportByBound(
        mindmap.elementBound,
        [20, 20, 20, 20],
        true
      );

      edgelessService.selection.set({
        editing: false,
        elements: [mindmap.tree.element.id],
      });
    });
  },
  createImage: imageHandler,
  createSlides: (host, ctx) => {
    const data = ctx.get();
    const contents = data.contents as unknown[];
    if (!contents) return;
    const images = data.images as { id: string; url: string }[][];
    const service = host.spec.getService<EdgelessRootService>('affine:page');

    (async function () {
      for (let i = 0; i < contents.length - 1; i++) {
        const image = images[i];
        const content = contents[i];
        const job = service.createTemplateJob('template');
        await Promise.all(
          image.map(({ id, url }) =>
            fetch(url)
              .then(res => res.blob())
              .then(blob => job.job.assets.set(id, blob))
          )
        );
        await job.insertTemplate(content);
        getSurfaceElementFromEditor(host).refresh();
      }
    })().catch(console.error);
  },
  expandMindmap: (host, ctx) => {
    const [surface] = host.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    const elements = ctx.get()[
      'selectedElements'
    ] as BlockSuite.EdgelessModelType[];
    const data = ctx.get() as {
      node: MindMapNode;
    };

    queueMicrotask(() => {
      getAIPanel(host).hide();
    });

    const mindmap = elements[0].group as MindmapElementModel;

    if (!data?.node) return;

    if (data.node.children) {
      data.node.children.forEach(childTree => {
        mindmap.addTree(elements[0].id, childTree);
      });

      const subtree = mindmap.getNode(elements[0].id);

      if (!subtree) return;

      surface.doc.transact(() => {
        const updateNodeSize = (node: typeof subtree) => {
          fitContent(node.element as ShapeElementModel);

          node.children.forEach(child => {
            updateNodeSize(child);
          });
        };

        updateNodeSize(subtree);
      });

      setTimeout(() => {
        const edgelessService = getEdgelessService(host);

        edgelessService.selection.set({
          editing: false,
          elements: [subtree.element.id],
        });
      });
    }
  },
  filterImage: imageHandler,
  makeItReal: (host, ctx) => {
    const aiPanel = getAIPanel(host);
    let html = aiPanel.answer;
    if (!html) return;
    html = preprocessHtml(html);

    const edgelessCopilot = getEdgelessCopilotWidget(host);
    const [surface] = host.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    const data = ctx.get();
    const bounds = edgelessCopilot.determineInsertionBounds(
      (data['width'] as number) || 800,
      (data['height'] as number) || 600
    );

    edgelessCopilot.hideCopilotPanel();
    aiPanel.hide();

    const edgelessRoot = getEdgelessRootFromEditor(host);

    host.doc.transact(() => {
      edgelessRoot.doc.addBlock(
        EmbedHtmlBlockSpec.schema.model.flavour as 'affine:embed-html',
        {
          design: 'ai:makeItReal', // as tag
          html,
          xywh: bounds.serialize(),
        },
        surface.id
      );
    });
  },
  processImage: imageHandler,
};

const getButtonText: {
  [key in keyof Partial<BlockSuitePresets.AIActions>]: (
    variants?: Omit<
      Parameters<BlockSuitePresets.AIActions[key]>[0],
      keyof BlockSuitePresets.AITextActionOptions
    >
  ) => string | undefined;
} = {
  brainstormMindmap: variants => {
    return variants?.regenerate ? 'Replace' : undefined;
  },
};

export function getInsertAndReplaceHandler<
  T extends keyof BlockSuitePresets.AIActions,
>(
  id: T,
  host: EditorHost,
  ctx: CtxRecord,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >
) {
  const handler = responses[id] ?? defaultHandler;
  const buttonText = getButtonText[id]?.(variants) ?? undefined;

  return createInsertResp(id, handler, host, ctx, buttonText);
}

export function actionToResponse<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  host: EditorHost,
  ctx: CtxRecord,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >
): FinishConfig {
  return {
    actions: [],
    responses: [
      {
        items: [
          {
            handler: () => {
              reportResponse('result:continue-in-chat');
              const panel = getAIPanel(host);
              AIProvider.slots.requestContinueInChat.emit({
                host: host,
                show: true,
              });
              panel.hide();
            },
            icon: ChatWithAIIcon,
            name: 'Continue in chat',
          },
          getInsertAndReplaceHandler(id, host, ctx, variants),
          useAsCaption(id, host),
          retry(getAIPanel(host)),
          discard(getAIPanel(host), getEdgelessCopilotWidget(host)),
        ],
        name: 'Response',
      },
    ],
  };
}

export function actionToGenerating<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  generatingIcon: TemplateResult<1>
) {
  return {
    generatingIcon,
    stages: generatingStages[id],
  };
}

export function actionToErrorResponse<
  T extends keyof BlockSuitePresets.AIActions,
>(
  panel: AffineAIPanelWidget,
  id: T,
  host: EditorHost,
  ctx: CtxRecord,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >
): ErrorConfig {
  return {
    cancel: () => {
      panel.hide();
    },
    login: () => {
      AIProvider.slots.requestLogin.emit({ host: panel.host });
      panel.hide();
    },
    responses: [
      {
        items: [getInsertAndReplaceHandler(id, host, ctx, variants)],
        name: 'Response',
      },
      {
        items: [
          retry(getAIPanel(host)),
          discard(getAIPanel(host), getEdgelessCopilotWidget(host)),
        ],
        name: '',
      },
    ],
    upgrade: () => {
      AIProvider.slots.requestUpgradePlan.emit({ host: panel.host });
      panel.hide();
    },
  };
}
