import type { BlockElement, EditorHost } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
  ChatWithAIIcon,
  DiscardIcon,
  InsertBelowIcon,
  ReplaceIcon,
  ResetIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import { createTextRenderer } from './messages/text.js';
import { AIProvider } from './provider.js';
import {
  insertFromMarkdown,
  markdownToSnapshot,
} from './utils/markdown-utils.js';

export function buildTextResponseConfig(panel: AffineAIPanelWidget) {
  const host = panel.host;
  const chain = host.std.command.chain();

  const getSelection = () => {
    const textSelection = host.selection.find('text');
    const mode = textSelection ? 'flat' : 'highest';
    const [_, { selectedBlocks }] = chain
      .tryAll(chain => [chain.getTextSelection(), chain.getBlockSelections()])
      .getSelectedBlocks({
        types: ['block', 'text'],
        mode,
      })
      .run();
    assertExists(selectedBlocks);
    const length = selectedBlocks.length;
    const firstBlock = selectedBlocks[0];
    const lastBlock = selectedBlocks[length - 1];
    const firstBlockId = firstBlock.model.id;
    const lastBlockId = lastBlock.model.id;
    const firstBlockParent = firstBlock.parentBlockElement;
    const lastBlockParent = lastBlock.parentBlockElement;
    const selectedModels = selectedBlocks.map(block => block.model);
    assertExists(firstBlockParent);
    assertExists(lastBlockParent);
    return {
      textSelection,
      selectedModels,
      firstBlockId,
      lastBlockId,
      firstBlockParent,
      lastBlockParent,
    };
  };

  const setBlockSelection = (parent: BlockElement, models: BlockModel[]) => {
    const parentPath = parent.path;
    const selections = models
      .map(model => [...parentPath, model.id])
      .map(path => host.selection.create('block', { path }));
    host.selection.setGroup('note', selections);
  };

  const replace = async () => {
    const selection = getSelection();
    if (!selection || !panel.answer) return;

    const { textSelection, firstBlockId, firstBlockParent, selectedModels } =
      selection;
    const firstIndex = firstBlockParent.model.children.findIndex(
      model => model.id === firstBlockId
    );

    if (textSelection) {
      const { snapshot, job } = await markdownToSnapshot(panel.answer, host);
      await job.snapshotToSlice(
        snapshot,
        host.doc,
        firstBlockParent.model.id,
        firstIndex + 1
      );
    } else {
      selectedModels.forEach(model => {
        host.doc.deleteBlock(model);
      });

      const models = await insertFromMarkdown(
        host,
        panel.answer ?? '',
        firstBlockParent.id,
        firstIndex
      );

      host.updateComplete
        .then(() => {
          setBlockSelection(firstBlockParent, models);
        })
        .catch(console.error);
    }

    panel.hide();
  };

  const insertBelow = async () => {
    const selection = getSelection();

    if (!selection) {
      return;
    }

    const { lastBlockId, lastBlockParent } = selection;
    const lastIndex = lastBlockParent.model.children.findIndex(
      model => model.id === lastBlockId
    );

    const models = await insertFromMarkdown(
      host,
      panel.answer ?? '',
      lastBlockParent.model.id,
      lastIndex + 1
    );

    host.updateComplete
      .then(() => {
        setBlockSelection(lastBlockParent, models);
      })
      .catch(console.error);

    panel.hide();
  };
  return [
    {
      name: 'Insert below',
      icon: InsertBelowIcon,
      handler: () => {
        insertBelow().catch(console.error);
      },
    },
    {
      name: 'Replace selection',
      icon: ReplaceIcon,
      handler: () => {
        replace().catch(console.error);
      },
    },
    {
      name: 'Discard',
      icon: DiscardIcon,
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
    answerRenderer: createTextRenderer(panel.host),
    finishStateConfig: {
      responses: buildTextResponseConfig(panel),
      actions: [
        {
          name: '',
          items: [
            {
              name: 'Continue in chat',
              icon: ChatWithAIIcon,
              handler: () => {
                AIProvider.slots.requestContinueInChat.emit(true);
              },
            },
            {
              name: 'Regenerate',
              icon: ResetIcon,
              handler: () => {
                panel.generate();
              },
            },
          ],
        },
      ], // ???
    },
    errorStateConfig: {
      upgrade: () => {},
      responses: [],
    },
  };
}

export const getAIPanel = (host: EditorHost): AffineAIPanelWidget => {
  const rootBlockId = host.doc.root?.id;
  assertExists(rootBlockId);
  const aiPanel = host.view.getWidget(AFFINE_AI_PANEL_WIDGET, rootBlockId);
  assertExists(aiPanel);
  if (!(aiPanel instanceof AffineAIPanelWidget)) {
    throw new Error('AI panel not found');
  }
  return aiPanel;
};
