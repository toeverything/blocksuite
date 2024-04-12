import type { EditorHost } from '@blocksuite/block-std';
import type {
  AffineAIPanelWidget,
  AffineAIPanelWidgetConfig,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import { getAIPanel } from '../ai-panel.js';
import { AIProvider } from '../provider.js';
import {
  getSelectedTextContent,
  getSelections,
} from '../utils/selection-utils.js';

function bindEventSource(
  stream: BlockSuitePresets.TextStream,
  {
    update,
    finish,
    signal,
  }: {
    update: (text: string) => void;
    finish: (state: 'success' | 'error' | 'aborted') => void;
    signal?: AbortSignal;
  }
) {
  (async () => {
    let answer = '';
    for await (const data of stream) {
      if (signal?.aborted) {
        finish('aborted');
        break;
      }
      answer += data;
      update(answer);
    }
    finish('success');
  })().catch(err => {
    if (err.name === 'AbortError') {
      finish('aborted');
    } else {
      finish('error');
    }
  });
}

function actionToStream<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >
) {
  const action = AIProvider.actions[id];
  if (!action || typeof action !== 'function') return;
  return (host: EditorHost): BlockSuitePresets.TextStream => {
    let stream: BlockSuitePresets.TextStream | undefined;
    return {
      async *[Symbol.asyncIterator]() {
        const panel = getAIPanel(host);
        const markdown = await getSelectedTextContent(panel.host);
        console.log('markdown: ', markdown);

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

function actionToGenerateAnswer<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >
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
      finish: (state: 'success' | 'error' | 'aborted') => void;
    }) => {
      const { selectedBlocks: blocks } = getSelections(host);
      if (!blocks || blocks.length === 0) return;
      const stream = actionToStream(id, variants)?.(host);
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
  >
) {
  return (host: EditorHost) => {
    const aiPanel = getAIPanel(host);
    assertExists(aiPanel.config);
    aiPanel.config.generateAnswer = actionToGenerateAnswer(id, variants)(host);
    const { selectedBlocks: blocks } = getSelections(aiPanel.host);
    if (!blocks || blocks.length === 0) return;
    aiPanel.toggle(blocks.at(-1)!, 'placeholder');
  };
}

export function handleAskAIAction(panel: AffineAIPanelWidget) {
  const host = panel.host;
  const selection = host.selection.find('text');
  const lastBlockPath = selection ? selection.to?.path ?? selection.path : null;
  if (!lastBlockPath) return;
  const block = host.view.viewFromPath('block', lastBlockPath);
  if (!block) return;
  const generateAnswer: AffineAIPanelWidgetConfig['generateAnswer'] = ({
    finish,
    input,
    signal,
    update,
  }) => {
    if (!AIProvider.actions.chat) return;
    const stream = AIProvider.actions.chat({
      input,
      stream: true,
      docId: host.doc.id,
      workspaceId: host.doc.collection.id,
    });
    bindEventSource(stream, { update, finish, signal });
  };
  assertExists(panel.config);
  panel.config.generateAnswer = generateAnswer;
  panel.toggle(block);
}
