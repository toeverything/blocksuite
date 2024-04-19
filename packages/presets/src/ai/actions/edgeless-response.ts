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
  DeleteIcon,
  EDGELESS_ELEMENT_TOOLBAR_WIDGET,
  EmbedHtmlBlockSpec,
  InsertBelowIcon,
  NoteDisplayMode,
  ResetIcon,
  updateMindmapNodeRect,
} from '@blocksuite/blocks';

import { insertFromMarkdown } from '../_common/markdown-utils.js';
import { getSurfaceElementFromEditor } from '../_common/selection-utils.js';
import { getAIPanel } from '../ai-panel.js';
import { copyTextAnswer } from '../utils/editor-actions.js';
import { preprocessHtml } from '../utils/html.js';
import { fetchImageToFile } from '../utils/image.js';
import { getEdgelessRootFromEditor } from '../utils/selection-utils.js';
import { EXCLUDING_COPY_ACTIONS } from './consts.js';

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

export function getCopilotSelectedElems(host: EditorHost): EdgelessModel[] {
  const service = getService(host);
  const copilogWidget = getEdgelessCopilotWidget(host);

  if (copilogWidget.visible) {
    return (service.tool.controllers['copilot'] as CopilotSelectionController)
      .selectedElements;
  }

  return service.selection.elements;
}

export function discard(
  panel: AffineAIPanelWidget,
  copilot: EdgelessCopilotWidget
): AIItemConfig {
  return {
    name: 'Discard',
    icon: DeleteIcon,
    handler: () => {
      const callback = () => {
        panel.hide();
        copilot.visible = false;
      };
      panel.discard(callback);
    },
  };
}

export function retry(panel: AffineAIPanelWidget): AIItemConfig {
  return {
    name: 'Retry',
    icon: ResetIcon,
    handler: () => {
      panel.generate();
    },
  };
}

export function createInsertResp(
  handler: (host: EditorHost, ctx: CtxRecord) => void,
  host: EditorHost,
  ctx: CtxRecord
): AIItemConfig {
  return {
    name: 'Insert below',
    icon: InsertBelowIcon,
    handler: () => {
      handler(host, ctx);
      const panel = getAIPanel(host);
      panel.hide();
    },
  };
}

export const responses: {
  [key in keyof Partial<BlockSuitePresets.AIActions>]: (
    host: EditorHost,
    ctx: CtxRecord
  ) => void;
} = {
  brainstormMindmap: (host, ctx) => {
    const aiPanel = getAIPanel(host);
    const edgelessCopilot = getEdgelessCopilotWidget(host);
    const [surface] = host.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = ctx.get() as any;
    const selectionRect = edgelessCopilot.selectionModelRect;

    edgelessCopilot.hideCopilotPanel();
    aiPanel.hide();

    const mindmapId = surface.addElement({
      type: 'mindmap',
      children: data.node,
      style: data.style,
    });
    const mindmap = surface.getElementById(mindmapId) as MindmapElementModel;

    host.doc.transact(() => {
      const rootElement = mindmap.tree.element;

      if (selectionRect) {
        rootElement.xywh = `[${selectionRect.x},${selectionRect.y},${rootElement.w},${rootElement.h}]`;
      }

      mindmap.childElements.forEach(shape => {
        updateMindmapNodeRect(shape as ShapeElementModel);
      });

      if (selectionRect) {
        queueMicrotask(() => {
          mindmap.moveTo([
            selectionRect.x,
            selectionRect.y,
            selectionRect.width,
            selectionRect.height,
          ]);
        });
      }
    });
  },
  makeItReal: host => {
    const aiPanel = getAIPanel(host);
    let html = aiPanel.answer;
    if (!html) return;
    html = preprocessHtml(html);

    const edgelessCopilot = getEdgelessCopilotWidget(host);
    const [surface] = host.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectionRect = edgelessCopilot.selectionModelRect;

    edgelessCopilot.hideCopilotPanel();
    aiPanel.hide();

    const edgelessRoot = getEdgelessRootFromEditor(host);
    const { left, top, height } = selectionRect;

    host.doc.transact(() => {
      edgelessRoot.doc.addBlock(
        EmbedHtmlBlockSpec.schema.model.flavour as 'affine:embed-html',
        { html, xywh: `[${left},${top + height + 20},400,200]` },
        surface.id
      );
    });
  },
  createSlides: (host, ctx) => {
    const data = ctx.get();
    const contents = data.contents as unknown[];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectionRect = edgelessCopilot.selectionModelRect;

    edgelessCopilot.hideCopilotPanel();
    aiPanel.hide();

    const filename = 'image';
    const imageProxy = host.std.clipboard.configs.get('imageProxy');

    fetchImageToFile(data, filename, imageProxy)
      .then(img => {
        if (!img) return;

        const edgelessRoot = getEdgelessRootFromEditor(host);
        const { left, top, height } = selectionRect;
        const [x, y] = edgelessRoot.service.viewport.toViewCoord(
          left,
          top + height + 20
        );

        host.doc.transact(() => {
          edgelessRoot.addImages([img], { x, y }).catch(console.error);
        });
      })
      .catch(console.error);
  },
};

const defaultHandler = (host: EditorHost) => {
  const edgelessCopilot = getEdgelessCopilotWidget(host);
  const doc = host.doc;
  const currentRect = edgelessCopilot.selectionModelRect;
  const panel = getAIPanel(host);

  doc.transact(() => {
    const noteBlockId = doc.addBlock(
      'affine:note',
      {
        xywh: `[${currentRect.x},${currentRect.y + currentRect.height + 20},800,95]`,
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

export function getResponseHandler<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  host: EditorHost,
  ctx: CtxRecord
) {
  const handler = responses[id] ?? defaultHandler;

  return createInsertResp(handler, host, ctx);
}

export function actionToResponse<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  host: EditorHost,
  ctx: CtxRecord
): FinishConfig {
  return {
    responses: [
      {
        name: 'Response',
        items: [
          getResponseHandler(id, host, ctx),
          retry(getAIPanel(host)),
          discard(getAIPanel(host), getEdgelessCopilotWidget(host)),
        ],
      },
    ],
    actions: [],
    copy: {
      allowed: !EXCLUDING_COPY_ACTIONS.includes(id),
      onCopy: () => {
        return copyTextAnswer(getAIPanel(host));
      },
    },
  };
}
