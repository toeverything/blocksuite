import type { EditorHost } from '@blocksuite/block-std';
import type {
  AffineAIPanelWidget,
  AIItemConfig,
  CopilotSelectionController,
  EdgelessCopilotWidget,
  EdgelessElementToolbarWidget,
  EdgelessModel,
  EdgelessRootService,
  MindmapElementModel,
  ShapeElementModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks';
import {
  AFFINE_EDGELESS_COPILOT_WIDGET,
  ChatWithAIIcon,
  DeleteIcon,
  EDGELESS_ELEMENT_TOOLBAR_WIDGET,
  EmbedHtmlBlockSpec,
  fitContent,
  InsertBelowIcon,
  NoteDisplayMode,
  ResetIcon,
} from '@blocksuite/blocks';

import { insertFromMarkdown } from '../_common/markdown-utils.js';
import { getSurfaceElementFromEditor } from '../_common/selection-utils.js';
import { getAIPanel } from '../ai-panel.js';
import { AIProvider } from '../provider.js';
import { reportResponse } from '../utils/action-reporter.js';
import { isMindMapRoot } from '../utils/edgeless.js';
import { preprocessHtml } from '../utils/html.js';
import { fetchImageToFile } from '../utils/image.js';
import {
  getEdgelessRootFromEditor,
  getEdgelessService,
} from '../utils/selection-utils.js';

export type CtxRecord = {
  get(): Record<string, unknown>;
  set(data: Record<string, unknown>): void;
};

type FinishConfig = Exclude<
  AffineAIPanelWidget['config'],
  null
>['finishStateConfig'];

export function getService(host: EditorHost) {
  const edgelessService = host.spec.getService(
    'affine:page'
  ) as EdgelessRootService;

  return edgelessService;
}

export function getEdgelessCopilotWidget(
  host: EditorHost
): EdgelessCopilotWidget {
  const rootBlockId = host.doc.root?.id as string;
  const copilotWidget = host.view.getWidget(
    AFFINE_EDGELESS_COPILOT_WIDGET,
    rootBlockId
  ) as EdgelessCopilotWidget;

  return copilotWidget;
}

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

export function getCopilotSelectedElems(host: EditorHost): EdgelessModel[] {
  const service = getService(host);
  const copilotWidget = getEdgelessCopilotWidget(host);

  if (copilotWidget.visible) {
    return (service.tool.controllers['copilot'] as CopilotSelectionController)
      .selectedElements;
  }

  return service.selection.elements;
}

export function discard(
  panel: AffineAIPanelWidget,
  _: EdgelessCopilotWidget
): AIItemConfig {
  return {
    name: 'Discard',
    icon: DeleteIcon,
    handler: () => {
      panel.discard();
    },
  };
}

export function retry(panel: AffineAIPanelWidget): AIItemConfig {
  return {
    name: 'Retry',
    icon: ResetIcon,
    handler: () => {
      reportResponse('result:retry');
      panel.generate();
    },
  };
}

export function createInsertResp(
  handler: (host: EditorHost, ctx: CtxRecord) => void,
  host: EditorHost,
  ctx: CtxRecord,
  buttonText: string = 'Insert below'
): AIItemConfig {
  return {
    name: buttonText,
    icon: InsertBelowIcon,
    handler: () => {
      reportResponse('result:insert');
      handler(host, ctx);
      const panel = getAIPanel(host);
      panel.hide();
    },
  };
}

type MindMapNode = {
  text: string;
  children: MindMapNode[];
};

export const responses: {
  [key in keyof Partial<BlockSuitePresets.AIActions>]: (
    host: EditorHost,
    ctx: CtxRecord
  ) => void;
} = {
  expandMindmap: (host, ctx) => {
    const [surface] = host.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    const elements = ctx.get()['selectedElements'] as EdgelessModel[];
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
          elements: [subtree.element.id],
          editing: false,
        });
      });
    }
  },
  brainstormMindmap: (host, ctx) => {
    const aiPanel = getAIPanel(host);
    const edgelessService = getEdgelessService(host);
    const edgelessCopilot = getEdgelessCopilotWidget(host);
    const selectionRect = edgelessCopilot.selectionModelRect;
    const [surface] = host.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];
    const elements = ctx.get()['selectedElements'] as EdgelessModel[];
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
      type: 'mindmap',
      children: data.node,
      style: data.style,
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
        elements: [mindmap.tree.element.id],
        editing: false,
      });
    });
  },
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
          html,
          design: 'ai:makeItReal', // as tag
          xywh: bounds.serialize(),
        },
        surface.id
      );
    });
  },
  createSlides: (host, ctx) => {
    const data = ctx.get();
    const contents = data.contents as unknown[];
    if (!contents) return;
    const images = data.images as { url: string; id: string }[][];
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
  createImage: host => {
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
          edgelessRoot.addImages([img], { x, y }, true).catch(console.error);
        });
      })
      .catch(console.error);
  },
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
        xywh: bounds.serialize(),
        displayMode: NoteDisplayMode.EdgelessOnly,
      },
      doc.root!.id
    );

    insertFromMarkdown(host, panel.answer!, noteBlockId)
      .then(() => {
        const service = getService(host);

        service.selection.set({
          elements: [noteBlockId],
          editing: false,
        });
      })
      .catch(err => {
        console.error(err);
      });
  });
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

  return createInsertResp(handler, host, ctx, buttonText);
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
    responses: [
      {
        name: 'Response',
        items: [
          {
            name: 'Continue in chat',
            icon: ChatWithAIIcon,
            handler: () => {
              reportResponse('result:continue-in-chat');
              const panel = getAIPanel(host);
              AIProvider.slots.requestContinueInChat.emit({
                host: host,
                show: true,
              });
              panel.hide();
            },
          },
          getInsertAndReplaceHandler(id, host, ctx, variants),
          retry(getAIPanel(host)),
          discard(getAIPanel(host), getEdgelessCopilotWidget(host)),
        ],
      },
    ],
    actions: [],
  };
}
