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
import {
  insertFromMarkdown,
  replaceFromMarkdown,
} from './utils/markdown-utils.js';

export function buildTextResponseConfig(panel: AffineAIPanelWidget) {
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
    if (!selection || !panel.answer) return;

    await replaceFromMarkdown(
      host,
      panel.answer,
      selection.block.model.id,
      selection.blockIndex
    );

    panel.hide();
  };

  const insertBelow = async () => {
    const selection = getSelection();

    if (!selection) {
      return;
    }

    await insertFromMarkdown(
      host,
      panel.answer ?? '',
      selection.blockParent.model.id,
      selection.blockIndex + 1
    );

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
