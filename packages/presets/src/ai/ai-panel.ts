import type { EditorHost } from '@blocksuite/block-std';
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
import type { ComputePositionConfig } from '@floating-ui/dom';

import { createTextRenderer } from './messages/text.js';
import { AIProvider } from './provider.js';
import { reportResponse } from './utils/action-reporter.js';
import {
  copyTextAnswer,
  insertBelow,
  replace,
} from './utils/editor-actions.js';
import { getSelections } from './utils/selection-utils.js';

export function buildTextResponseConfig(panel: AffineAIPanelWidget) {
  const host = panel.host;

  const getSelection = () => {
    const textSelection = host.selection.find('text');
    const mode = textSelection ? 'flat' : 'highest';
    const { selectedBlocks } = getSelections(host, mode);
    assertExists(selectedBlocks);
    const length = selectedBlocks.length;
    const firstBlock = selectedBlocks[0];
    const lastBlock = selectedBlocks[length - 1];
    const selectedModels = selectedBlocks.map(block => block.model);
    return {
      textSelection,
      selectedModels,
      firstBlock,
      lastBlock,
    };
  };

  const _replace = async () => {
    const selection = getSelection();
    if (!selection || !panel.answer) return;

    const { textSelection, firstBlock, selectedModels } = selection;
    await replace(
      host,
      panel.answer,
      firstBlock,
      selectedModels,
      textSelection
    );

    panel.hide();
  };

  const _insertBelow = async () => {
    const selection = getSelection();

    if (!selection || !panel.answer) {
      return;
    }

    const { lastBlock } = selection;
    await insertBelow(host, panel.answer ?? '', lastBlock);
    panel.hide();
  };

  return [
    {
      name: 'Response',
      items: [
        {
          name: 'Insert below',
          icon: InsertBelowIcon,
          handler: () => {
            reportResponse('result:insert');
            _insertBelow().catch(console.error);
          },
        },
        {
          name: 'Replace selection',
          icon: ReplaceIcon,
          handler: () => {
            reportResponse('result:replace');
            _replace().catch(console.error);
          },
        },
      ],
    },
    {
      name: '',
      items: [
        {
          name: 'Continue in chat',
          icon: ChatWithAIIcon,
          handler: () => {
            reportResponse('result:continue-in-chat');
            AIProvider.slots.requestContinueInChat.emit({
              host: panel.host,
              show: true,
            });
            panel.hide();
          },
        },
        {
          name: 'Regenerate',
          icon: ResetIcon,
          handler: () => {
            reportResponse('result:retry');
            panel.generate();
          },
        },
        {
          name: 'Discard',
          icon: DiscardIcon,
          handler: () => {
            panel.discard();
          },
        },
      ],
    },
  ];
}

export function buildErrorResponseConfig(panel: AffineAIPanelWidget) {
  return [
    {
      name: 'Response',
      items: [
        {
          name: 'Regenerate',
          icon: ResetIcon,
          handler: () => {
            reportResponse('result:retry');
            panel.generate();
          },
        },
        {
          name: 'Discard',
          icon: DiscardIcon,
          handler: () => {
            panel.discard();
          },
        },
      ],
    },
  ];
}

export function buildFinishConfig(panel: AffineAIPanelWidget) {
  return {
    responses: buildTextResponseConfig(panel),
    actions: [],
  };
}

export function buildErrorConfig(panel: AffineAIPanelWidget) {
  return {
    upgrade: () => {
      AIProvider.slots.requestUpgradePlan.emit({ host: panel.host });
      panel.hide();
    },
    login: () => {
      AIProvider.slots.requestLogin.emit({ host: panel.host });
      panel.hide();
    },
    responses: buildErrorResponseConfig(panel),
  };
}

export function buildCopyConfig(panel: AffineAIPanelWidget) {
  return {
    allowed: true,
    onCopy: () => {
      return copyTextAnswer(panel);
    },
  };
}

export function buildAIPanelConfig(
  panel: AffineAIPanelWidget,
  positionConfig?: Partial<ComputePositionConfig>
): AffineAIPanelWidgetConfig {
  return {
    answerRenderer: createTextRenderer(panel.host, 320),
    finishStateConfig: buildFinishConfig(panel),
    errorStateConfig: buildErrorConfig(panel),
    positionConfig,
    copy: buildCopyConfig(panel),
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
