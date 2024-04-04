import type { BlockStdScope, EditorHost } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
  type AffineTextAttributes,
  type AIItemConfig,
  type AIItemGroupConfig,
  defaultImageProxyMiddleware,
  DeleteIcon,
  InsertBelowIcon,
  MixTextAdapter,
  pasteMiddleware,
  ReplaceIcon,
  ResetIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { INLINE_ROOT_ATTR } from '@blocksuite/inline/consts';
import type { InlineRootElement } from '@blocksuite/inline/inline-editor';
import type { Doc } from '@blocksuite/store';
import { Job } from '@blocksuite/store';

import { textRenderer } from '../messages/text.js';
import type { AffineAIItemConfig, AIActionItem, AIConfig } from '../types.js';

export function bindEventSource(
  stream: EventSource,
  {
    update,
    finish,
    signal,
  }: {
    update: (text: string) => void;
    finish: (state: 'success' | 'error' | 'aborted') => void;
    signal: AbortSignal;
  }
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let answer = '';
  stream.addEventListener('message', e => {
    if (timeout) clearTimeout(timeout);
    answer += e.data;
    update(answer);

    // Terminate after 5 seconds of inactivity
    timeout = setTimeout(() => {
      finish('error');
      stream.close();
    }, 5000);
  });
  stream.addEventListener('error', () => {
    if (timeout) clearTimeout(timeout);
    finish('success');
  });
  signal.addEventListener('abort', () => {
    stream.close();
    finish('aborted');
  });
}

export function buildAIActionGroups(config: AIConfig): AIItemGroupConfig[] {
  const getSelections = (host: EditorHost) => {
    const [_, data] = host.command
      .chain()
      .tryAll(chain => [chain.getTextSelection(), chain.getBlockSelections()])
      .getSelectedBlocks({ types: ['text', 'block'] })
      .run();

    return data;
  };
  const toGenerateAnswer = (
    item: AIActionItem,
    panel: AffineAIPanelWidget
  ): AffineAIPanelWidgetConfig['generateAnswer'] => {
    return ({ input: _input, update, finish, signal }) => {
      const { selectedBlocks: blocks, currentTextSelection: textSelection } =
        getSelections(panel.host);

      if (!blocks || blocks.length === 0) return;

      let text = '';

      if (textSelection) {
        const selectedInlineEditors = blocks.flatMap(el => {
          const inlineRoot = el.querySelector<
            InlineRootElement<AffineTextAttributes>
          >(`[${INLINE_ROOT_ATTR}]`);
          if (inlineRoot && inlineRoot.inlineEditor.getInlineRange()) {
            return inlineRoot.inlineEditor;
          }
          return [];
        });

        text = selectedInlineEditors
          .map(inlineEditor => {
            const inlineRange = inlineEditor.getInlineRange();
            if (!inlineRange) return '';
            const delta = inlineEditor.getDeltaByRangeIndex(inlineRange.index);
            if (!delta) return '';
            return delta.insert.slice(
              inlineRange.index,
              inlineRange.index + inlineRange.length
            );
          })
          .join('');
      } else {
        text = blocks
          .map(block => block.model.text?.toString() ?? '')
          .join('\n');
      }
      item
        .textToTextStream?.(panel.host.doc, text)
        .then(stream => {
          bindEventSource(stream, { update, finish, signal });
        })
        .catch(console.error);
    };
  };

  const getAIPanel = (host: EditorHost): AffineAIPanelWidget => {
    const rootBlockId = host.doc.root?.id;
    assertExists(rootBlockId);
    const aiPanel = host.view.getWidget(AFFINE_AI_PANEL_WIDGET, rootBlockId);
    assertExists(aiPanel);
    if (!(aiPanel instanceof AffineAIPanelWidget)) {
      throw new Error('AI panel not found');
    }
    return aiPanel;
  };

  const toHandler = (item: AIActionItem) => {
    return (host: EditorHost) => {
      const aiPanel = getAIPanel(host);
      assertExists(aiPanel.config);
      aiPanel.config.generateAnswer = toGenerateAnswer(item, aiPanel);
      const { selectedBlocks: blocks } = getSelections(aiPanel.host);
      if (!blocks || blocks.length === 0) return;
      aiPanel.toggle(blocks.at(-1)!, 'placeholder');
    };
  };

  const convert = (item: AffineAIItemConfig): AIItemConfig => {
    assertExists(item.icon, 'Icon is required');
    const result: AIItemConfig = {
      name: item.name,
      icon: item.icon,
      showWhen: item.showWhen,
      handler: toHandler(item),
    };

    if (item.subItems) {
      result.subItem = item.subItems.map(subItem => {
        return {
          type: subItem.name,
          handler: toHandler(subItem),
        };
      });
    }

    return result;
  };

  return config.actionGroups.map(group => {
    return {
      ...group,
      items: group.items.map(convert),
    };
  });
}

const setupSnapshotManager = (doc: Doc, std: BlockStdScope) => {
  const job = new Job({
    collection: doc.collection,
    middlewares: [defaultImageProxyMiddleware, pasteMiddleware(std)],
  });
  const adapter = new MixTextAdapter();
  adapter.applyConfigs(job.adapterConfigs);
  return {
    job,
    adapter,
  };
};

type SnapshotManager = ReturnType<typeof setupSnapshotManager>;

const toSnapshot = async (
  doc: Doc,
  { adapter, job }: SnapshotManager,
  answer: string
) => {
  const snapshot = await adapter.toSliceSnapshot({
    file: answer ?? '',
    assets: job.assetsManager,
    pageVersion: doc.collection.meta.pageVersion!,
    blockVersions: doc.collection.meta.blockVersions!,
    workspaceVersion: doc.collection.meta.workspaceVersion!,
    workspaceId: doc.collection.id,
    pageId: doc.id,
  });

  return snapshot;
};

function buildResponseConfig(panel: AffineAIPanelWidget) {
  const host = panel.host;

  const getSelection = () => {
    let paths: string[] = [];
    const textSelection = host.selection.find('text');

    if (textSelection) {
      paths = textSelection.to?.path ?? textSelection.path;
    } else {
      const blockSelection = host.selection.find('block');
      if (blockSelection) {
        paths = blockSelection.path;
      }
    }

    if (!paths) return null;
    const block = host.view.viewFromPath('block', paths);
    if (!block) return null;
    const blockParent = host.view.viewFromPath('block', block.parentPath);
    if (!blockParent) return;
    const blockIndex = blockParent.model.children.findIndex(
      x => x.id === block.model.id
    );

    return {
      block,
      blockParent,
      blockIndex,
    };
  };

  const replace = async () => {
    const selection = getSelection();
    if (!selection) return;

    const { job, adapter } = setupSnapshotManager(host.doc, host.std);
    const snapshot = panel.answer
      ? await toSnapshot(panel.doc, { job, adapter }, panel.answer)
      : null;

    if (!snapshot) return;

    // FIXME: replace when selection is block is buggy right not
    await job.snapshotToSlice(
      snapshot,
      host.doc,
      selection.blockParent.model.id,
      selection.blockIndex
    );

    panel.hide();
  };

  const insertBelow = async () => {
    const doc = host.doc;

    const selection = getSelection();

    if (!selection) {
      return;
    }

    const manager = setupSnapshotManager(doc, host.std);
    const snapshot = panel.answer
      ? await toSnapshot(panel.doc, manager, panel.answer)
      : null;

    if (!snapshot) {
      return;
    }

    const blockSnapshots = snapshot.content.flatMap(x => x.children);
    for (const [index, snapshot] of blockSnapshots.entries()) {
      await manager.job.snapshotToBlock(
        snapshot,
        doc,
        selection.blockParent.model.id,
        selection.blockIndex + index
      );
    }

    panel.hide();
  };
  return [
    {
      name: 'Regenerate',
      icon: ResetIcon,
      handler: () => {
        panel.generate();
      },
    },
    {
      name: 'Insert',
      icon: InsertBelowIcon,
      handler: () => {
        insertBelow().catch(console.error);
      },
    },
    {
      name: 'Replace',
      icon: ReplaceIcon,
      handler: () => {
        replace().catch(console.error);
      },
    },
    {
      name: 'Discard',
      icon: DeleteIcon,
      handler: () => {
        panel.hide();
      },
    },
  ];
}

export function buildAIPanelConfig(
  panel: AffineAIPanelWidget
): AffineAIPanelWidgetConfig {
  return {
    answerRenderer: textRenderer,
    finishStateConfig: {
      responses: buildResponseConfig(panel),
      actions: [], // ???
    },
    errorStateConfig: {
      upgrade: () => {},
      responses: [],
    },
  };
}

export function handleAskAIAction(
  panel: AffineAIPanelWidget,
  getAskAIStream: NonNullable<AIConfig['getAskAIStream']>
) {
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
    getAskAIStream(host.doc, input)
      .then(stream => {
        bindEventSource(stream, { update, finish, signal });
      })
      .catch(console.error);
  };
  assertExists(panel.config);
  panel.config.generateAnswer = generateAnswer;
  panel.toggle(block);
}
