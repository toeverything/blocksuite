import type { EditorHost } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
  DiscardIcon,
} from '@blocksuite/blocks';
import {
  type AffineAIPanelWidgetConfig,
  InsertBelowIcon,
  ReplaceIcon,
  ResetIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import { createTextRenderer } from './messages/text.js';
import { insertFromMarkdown } from './utils/markdown-utils.js';
import { getSelections } from './utils/selection-utils.js';

export function buildTextResponseConfig(panel: AffineAIPanelWidget) {
  const host = panel.host;

  const getSelection = () => {
    const { selectedBlocks: blocks } = getSelections(panel.host);
    if (!blocks || !blocks.length) return null;

    const firstBlockId = blocks[0].model.id;
    const firstBlockParent = blocks[0].parentBlockElement;
    const lastBlockId = blocks.at(-1)!.model.id;
    const lastBlockParent = blocks.at(-1)!.parentBlockElement;

    return {
      blocks,
      firstBlockId,
      lastBlockId,
      firstBlockParent,
      lastBlockParent,
    };
  };

  const replace = async () => {
    const selection = getSelection();
    if (!selection || !panel.answer) return;

    const { blocks, firstBlockId, firstBlockParent } = selection;
    // update selected block
    const firstIndex = firstBlockParent.model.children.findIndex(
      child => child.id === firstBlockId
    ) as number;

    blocks.forEach(block => {
      host.doc.deleteBlock(block.model);
    });

    const models = await insertFromMarkdown(
      host,
      panel.answer,
      firstBlockParent.model.id,
      firstIndex
    );

    setTimeout(() => {
      const parentPath = firstBlockParent.path;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => host.selection.create('block', { path }));
      host.selection.setGroup('note', selections);
    }, 0);

    panel.hide();
  };

  const insertBelow = async () => {
    const selection = getSelection();

    if (!selection || !panel.answer) {
      return;
    }

    const { lastBlockParent, lastBlockId } = selection;
    const lastBlockIndex = lastBlockParent.model.children.findIndex(
      child => child.id === lastBlockId
    ) as number;

    const models = await insertFromMarkdown(
      host,
      panel.answer,
      lastBlockParent.model.id,
      lastBlockIndex + 1
    );

    setTimeout(() => {
      const parentPath = lastBlockParent.path;
      const selections = models
        .map(model => [...parentPath, model.id])
        .map(path => host.selection.create('block', { path }));
      host.selection.setGroup('note', selections);
    }, 0);

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
      actions: [], // ???
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
