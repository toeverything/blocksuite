import type { EditorHost } from '@blocksuite/block-std';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { TemplateResult } from 'lit';

import {
  AIStarIconWithAnimation,
  ChatWithAIIcon,
  DiscardIcon,
  InsertBelowIcon,
  InsertTopIcon,
  ReplaceIcon,
  RetryIcon,
} from './_common/icons.js';
import { INSERT_ABOVE_ACTIONS } from './actions/consts.js';
import { createTextRenderer } from './messages/text.js';
import { AIProvider } from './provider.js';
import { reportResponse } from './utils/action-reporter.js';
import {
  copyTextAnswer,
  insertAbove,
  insertBelow,
  replace,
} from './utils/editor-actions.js';
import { getSelections } from './utils/selection-utils.js';

function getSelection(host: EditorHost) {
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
}

export function buildTextResponseConfig<
  T extends keyof BlockSuitePresets.AIActions,
>(panel: AffineAIPanelWidget, id?: T) {
  const host = panel.host;

  const _replace = async () => {
    const selection = getSelection(host);
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
    const selection = getSelection(host);

    if (!selection || !panel.answer) {
      return;
    }

    const { lastBlock } = selection;
    await insertBelow(host, panel.answer ?? '', lastBlock);
    panel.hide();
  };

  const _insertAbove = async () => {
    const selection = getSelection(host);
    if (!selection || !panel.answer) return;

    const { firstBlock } = selection;
    await insertAbove(host, panel.answer, firstBlock);
    panel.hide();
  };

  return [
    {
      name: 'Response',
      items: [
        {
          name: 'Insert below',
          icon: InsertBelowIcon,
          showWhen: () =>
            !!panel.answer && (!id || !INSERT_ABOVE_ACTIONS.includes(id)),
          handler: () => {
            reportResponse('result:insert');
            _insertBelow().catch(console.error);
          },
        },
        {
          name: 'Insert above',
          icon: InsertTopIcon,
          showWhen: () =>
            !!panel.answer && !!id && INSERT_ABOVE_ACTIONS.includes(id),
          handler: () => {
            reportResponse('result:insert');
            _insertAbove().catch(console.error);
          },
        },
        {
          name: 'Replace selection',
          icon: ReplaceIcon,
          showWhen: () => !!panel.answer,
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
          icon: RetryIcon,
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

export function buildErrorResponseConfig<
  T extends keyof BlockSuitePresets.AIActions,
>(panel: AffineAIPanelWidget, id?: T) {
  const host = panel.host;
  const _replace = async () => {
    const selection = getSelection(host);
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
    const selection = getSelection(host);

    if (!selection || !panel.answer) {
      return;
    }

    const { lastBlock } = selection;
    await insertBelow(host, panel.answer ?? '', lastBlock);
    panel.hide();
  };

  const _insertAbove = async () => {
    const selection = getSelection(host);
    if (!selection || !panel.answer) return;

    const { firstBlock } = selection;
    await insertAbove(host, panel.answer, firstBlock);
    panel.hide();
  };

  return [
    {
      name: 'Response',
      items: [
        {
          name: 'Replace selection',
          icon: ReplaceIcon,
          showWhen: () => !!panel.answer,
          handler: () => {
            _replace().catch(console.error);
          },
        },
        {
          name: 'Insert below',
          icon: InsertBelowIcon,
          showWhen: () =>
            !!panel.answer && (!id || !INSERT_ABOVE_ACTIONS.includes(id)),
          handler: () => {
            _insertBelow().catch(console.error);
          },
        },
        {
          name: 'Insert above',
          icon: InsertTopIcon,
          showWhen: () =>
            !!panel.answer && !!id && INSERT_ABOVE_ACTIONS.includes(id),
          handler: () => {
            reportResponse('result:insert');
            _insertAbove().catch(console.error);
          },
        },
      ],
    },
    {
      name: '',
      items: [
        {
          name: 'Retry',
          icon: RetryIcon,
          showWhen: () => true,
          handler: () => {
            reportResponse('result:retry');
            panel.generate();
          },
        },
        {
          name: 'Discard',
          icon: DiscardIcon,
          showWhen: () => !!panel.answer,
          handler: () => {
            panel.discard();
          },
        },
      ],
    },
  ];
}

export function buildFinishConfig<T extends keyof BlockSuitePresets.AIActions>(
  panel: AffineAIPanelWidget,
  id?: T
) {
  return {
    responses: buildTextResponseConfig(panel, id),
    actions: [],
  };
}

export function buildErrorConfig<T extends keyof BlockSuitePresets.AIActions>(
  panel: AffineAIPanelWidget,
  id?: T
) {
  return {
    upgrade: () => {
      AIProvider.slots.requestUpgradePlan.emit({ host: panel.host });
      panel.hide();
    },
    login: () => {
      AIProvider.slots.requestLogin.emit({ host: panel.host });
      panel.hide();
    },
    cancel: () => {
      panel.hide();
    },
    responses: buildErrorResponseConfig(panel, id),
  };
}

export function buildGeneratingConfig(generatingIcon?: TemplateResult<1>) {
  return {
    generatingIcon: generatingIcon ?? AIStarIconWithAnimation,
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
  panel: AffineAIPanelWidget
): AffineAIPanelWidgetConfig {
  return {
    answerRenderer: createTextRenderer(panel.host, { maxHeight: 320 }),
    finishStateConfig: buildFinishConfig(panel),
    generatingStateConfig: buildGeneratingConfig(),
    errorStateConfig: buildErrorConfig(panel),
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
