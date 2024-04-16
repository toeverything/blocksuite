import type { EditorHost } from '@blocksuite/block-std';
import type { AffineAIPanelWidget, AIError } from '@blocksuite/blocks';
import { MindmapElementModel, NoteBlockModel } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { Slice } from '@blocksuite/store';

import { getAIPanel } from '../ai-panel.js';
import { createMindmapRenderer } from '../messages/mindmap.js';
import { createSlidesRenderer } from '../messages/slides-renderer.js';
import { createTextRenderer } from '../messages/text.js';
import {
  createIframeRenderer,
  createImageRenderer,
} from '../messages/wrapper.js';
import { AIProvider } from '../provider.js';
import { getMarkdownFromSlice } from '../utils/markdown-utils.js';
import type { CtxRecord } from './edgeless-response.js';
import {
  actionToResponse,
  getCopilotSelectedElems,
  getEdgelessCopilotWidget,
} from './edgeless-response.js';
import { bindEventSource } from './handler.js';

type AnwserRenderer = Exclude<
  AffineAIPanelWidget['config'],
  null
>['answerRenderer'];

function actionToRenderer<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  host: EditorHost,
  ctx: CtxRecord
): AnwserRenderer {
  if (id === 'brainstormMindmap' || id === 'expandMindmap') {
    return createMindmapRenderer(host, ctx);
  }

  if (id === 'createSlides') {
    return createSlidesRenderer(host, ctx);
  }

  if (id === 'makeItReal') {
    return createIframeRenderer;
  }

  if (id === 'createImage') {
    return createImageRenderer;
  }

  return createTextRenderer(host);
}

function getTextFromSelected(host: EditorHost) {
  const selected = getCopilotSelectedElems(host);

  if (selected[0] instanceof NoteBlockModel) {
    const slice = Slice.fromModels(host.doc, selected[0].children);

    return getMarkdownFromSlice(host, slice);
  }

  return '';
}

function actionToStream<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >,
  extract?: (host: EditorHost) => Promise<{
    content?: string;
    attachments?: string[];
  } | void>
) {
  const action = AIProvider.actions[id];

  if (!action || typeof action !== 'function') return;

  if (extract && typeof extract === 'function') {
    return (host: EditorHost): BlockSuitePresets.TextStream => {
      let stream: BlockSuitePresets.TextStream | undefined;
      return {
        async *[Symbol.asyncIterator]() {
          const options = {
            ...variants,
            stream: true,
            docId: host.doc.id,
            workspaceId: host.doc.collection.id,
          } as Parameters<typeof action>[0];

          const data = await extract(host);
          if (data) {
            Object.assign(options, data);
          }

          // @ts-expect-error todo: maybe fix this
          stream = action(options);
          if (!stream) return;
          yield* stream;
        },
      };
    };
  }

  return (host: EditorHost): BlockSuitePresets.TextStream => {
    let stream: BlockSuitePresets.TextStream | undefined;
    return {
      async *[Symbol.asyncIterator]() {
        const panel = getAIPanel(host);
        const markdown = await getTextFromSelected(panel.host);

        const options = {
          ...variants,
          input: markdown,
          stream: true,
          docId: host.doc.id,
          workspaceId: host.doc.collection.id,
        } as Parameters<typeof action>[0];

        // @ts-expect-error todo: maybe fix this
        stream = action(options);
        if (!stream) return;
        yield* stream;
      },
    };
  };
}

function actionToGeneration<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >,
  extract?: (host: EditorHost) => Promise<{
    content?: string;
    attachments?: string[];
  } | void>
) {
  return (host: EditorHost) => {
    return ({
      signal,
      update,
      finish,
    }: {
      input: string;
      signal?: AbortSignal;
      update: (text: string) => void;
      finish: (state: 'success' | 'error' | 'aborted', err?: AIError) => void;
    }) => {
      const selectedElements = getCopilotSelectedElems(host);

      if (selectedElements.length === 0) return;

      const stream = actionToStream(id, variants, extract)?.(host);

      if (!stream) return;

      bindEventSource(stream, { update, finish, signal });
    };
  };
}

export function actionToHandler<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >,
  extract?: (host: EditorHost) => Promise<{
    content?: string;
    attachments?: string[];
  } | void>
) {
  return (host: EditorHost) => {
    const aiPanel = getAIPanel(host);
    const edgelessCopilot = getEdgelessCopilotWidget(host);
    let internal: Record<string, unknown> = {};
    const ctx = {
      get() {
        return internal;
      },
      set(data: Record<string, unknown>) {
        internal = data;
      },
    };

    edgelessCopilot.hideCopilotPanel();

    assertExists(aiPanel.config);

    aiPanel.host = host;
    aiPanel.config.generateAnswer = actionToGeneration(
      id,
      variants,
      extract
    )(host);
    aiPanel.config.answerRenderer = actionToRenderer(id, host, ctx);
    aiPanel.config.finishStateConfig = actionToResponse(id, host, ctx);
    aiPanel.config.discardCallback = () => {
      edgelessCopilot.visible = false;
    };

    aiPanel.toggle(edgelessCopilot.selectionElem, 'placeholder');
  };
}

export function noteBlockShowWen(_: unknown, __: unknown, host: EditorHost) {
  const selected = getCopilotSelectedElems(host);

  return selected[0] instanceof NoteBlockModel;
}

export function noteWithCodeBlockShowWen(
  _: unknown,
  __: unknown,
  host: EditorHost
) {
  const selected = getCopilotSelectedElems(host);

  return selected[0] instanceof NoteBlockModel;
}

export function mindmapShowWhen(_: unknown, __: unknown, host: EditorHost) {
  const selected = getCopilotSelectedElems(host);

  return selected[0] instanceof MindmapElementModel;
}

export function makeItRealShowWhen(_: unknown, __: unknown, host: EditorHost) {
  const selected = getCopilotSelectedElems(host);
  return selected.length > 0;
}
