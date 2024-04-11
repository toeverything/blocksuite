import type { EditorHost } from '@blocksuite/block-std';
import type {
  AffineAIPanelWidget,
  CopilotSelectionController,
  EdgelessCopilotWidget,
  EdgelessModel,
  EdgelessRootService,
  MindmapElementModel,
  ShapeElementModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks';
import {
  AFFINE_EDGELESS_COPILOT_WIDGET,
  DeleteIcon,
  EmbedHtmlBlockSpec,
  InsertBelowIcon,
  NoteDisplayMode,
  ResetIcon,
  updateMindmapNodeRect,
} from '@blocksuite/blocks';

import { insertFromMarkdown } from '../_common/markdown-utils.js';
import { getAIPanel } from '../ai-panel.js';
import { getEdgelessRootFromEditor } from '../utils/selection-utils.js';

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

export function getCopilotPanel(host: EditorHost): EdgelessCopilotWidget {
  const rootBlockId = host.doc.root?.id as string;
  const copilotPanel = host.view.getWidget(
    AFFINE_EDGELESS_COPILOT_WIDGET,
    rootBlockId
  ) as EdgelessCopilotWidget;

  return copilotPanel;
}

export function getCopilotSelectedElems(host: EditorHost): EdgelessModel[] {
  const service = getService(host);

  return (service.tool.controllers['copilot'] as CopilotSelectionController)
    .selectedElements;
}

export function discard(
  panel: AffineAIPanelWidget
): FinishConfig['responses'][number] {
  return {
    name: 'Discard',
    icon: DeleteIcon,
    handler: () => {
      panel.hide();
    },
  };
}

export function retry(
  panel: AffineAIPanelWidget
): FinishConfig['responses'][number] {
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
): FinishConfig['responses'][number] {
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
    const copilotPanel = getCopilotPanel(host);
    const [surface] = host.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = ctx.get() as any;
    const selectionRect = copilotPanel.selectionModelRect;

    copilotPanel.hide();
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
    const html = aiPanel.answer;
    if (!html) return;

    const copilotPanel = getCopilotPanel(host);
    const [surface] = host.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectionRect = copilotPanel.selectionModelRect;

    copilotPanel.hide();
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
};

const defaultHandler = (host: EditorHost) => {
  const copilotPanel = getCopilotPanel(host);
  const doc = host.doc;
  const currentRect = copilotPanel.selectionModelRect;
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
      getResponseHandler(id, host, ctx),
      retry(getAIPanel(host)),
      discard(getAIPanel(host)),
    ],
    actions: [],
  };
}
