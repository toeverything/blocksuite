import type { EditorHost } from '@blocksuite/block-std';
import type { AIError } from '@blocksuite/blocks';
import {
  type AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import { buildCopyConfig, buildFinishConfig, getAIPanel } from '../ai-panel.js';
import { createTextRenderer } from '../messages/text.js';
import { AIProvider } from '../provider.js';
import {
  getSelectedImagesAsBlobs,
  getSelectedTextContent,
  getSelections,
} from '../utils/selection-utils.js';

export function bindEventSource(
  stream: BlockSuitePresets.TextStream,
  {
    update,
    finish,
    signal,
  }: {
    update: (text: string) => void;
    finish: (state: 'success' | 'error' | 'aborted', err?: AIError) => void;
    signal?: AbortSignal;
  }
) {
  (async () => {
    let answer = '';
    for await (const data of stream) {
      if (signal?.aborted) {
        finish('aborted');
        return;
      }
      answer += data;
      update(answer);
    }
    finish('success');
  })().catch(err => {
    if (signal?.aborted) return;
    if (err.name === 'AbortError') {
      finish('aborted');
    } else {
      finish('error', err);
    }
  });
}

export function actionToStream<T extends keyof BlockSuitePresets.AIActions>(
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
        const selections = getSelections(host);
        const [markdown, attachments] = await Promise.all([
          getSelectedTextContent(host),
          getSelectedImagesAsBlobs(host),
        ]);
        // for now if there are more than one selected blocks, we will not omit the attachments
        const sendAttachments =
          selections?.selectedBlocks?.length === 1 && attachments.length > 0;
        const options = {
          ...variants,
          attachments: sendAttachments ? attachments : undefined,
          input: sendAttachments ? '' : markdown,
          stream: true,
          host,
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

export function actionToGenerateAnswer<
  T extends keyof BlockSuitePresets.AIActions,
>(
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
      finish: (state: 'success' | 'error' | 'aborted', err?: AIError) => void;
    }) => {
      const { selectedBlocks: blocks } = getSelections(host);
      if (!blocks || blocks.length === 0) return;
      const stream = actionToStream(id, variants)?.(host);
      if (!stream) return;
      bindEventSource(stream, { update, finish, signal });
    };
  };
}

/**
 * TODO: Should update config according to the action type
 * When support mind-map. generate image, generate slides on doc mode or in edgeless note block
 * Currently, only support text action
 */
function updateAIPanelConfig<T extends keyof BlockSuitePresets.AIActions>(
  aiPanel: AffineAIPanelWidget,
  id: T,
  variants?: Omit<
    Parameters<BlockSuitePresets.AIActions[T]>[0],
    keyof BlockSuitePresets.AITextActionOptions
  >
) {
  const { config, host } = aiPanel;
  assertExists(config);
  config.generateAnswer = actionToGenerateAnswer(id, variants)(host);
  config.answerRenderer = createTextRenderer(host, 320);
  config.finishStateConfig = buildFinishConfig(aiPanel);
  config.copy = buildCopyConfig(aiPanel);
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
    updateAIPanelConfig(aiPanel, id, variants);
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
      host,
      where: 'ai-panel',
      docId: host.doc.id,
      workspaceId: host.doc.collection.id,
    });
    bindEventSource(stream, { update, finish, signal });
  };
  assertExists(panel.config);
  panel.config.generateAnswer = generateAnswer;
  panel.toggle(block);
}
