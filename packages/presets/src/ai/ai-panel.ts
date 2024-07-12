import type { EditorHost } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import {
  AFFINE_AI_PANEL_WIDGET,
  type AIItemConfig,
  AffineAIPanelWidget,
  type AffineAIPanelWidgetConfig,
  Bound,
  ImageBlockModel,
  NoteDisplayMode,
  isInsideEdgelessEditor,
  matchFlavours,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import {
  AIPenIcon,
  AIStarIconWithAnimation,
  ChatWithAIIcon,
  CreateIcon,
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
import { findNoteBlockModel, getService } from './utils/edgeless.js';
import {
  copyTextAnswer,
  insertAbove,
  insertBelow,
  replace,
} from './utils/editor-actions.js';
import { insertFromMarkdown } from './utils/markdown-utils.js';
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
    firstBlock,
    lastBlock,
    selectedModels,
    textSelection,
  };
}

function useAsCaption<T extends keyof BlockSuitePresets.AIActions>(
  host: EditorHost,
  id?: T
): AIItemConfig {
  return {
    handler: () => {
      reportResponse('result:use-as-caption');
      const panel = getAIPanel(host);
      const caption = panel.answer;
      if (!caption) return;

      const { selectedBlocks } = getSelections(host);
      if (!selectedBlocks || selectedBlocks.length !== 1) return;

      const imageBlock = selectedBlocks[0].model;
      if (!(imageBlock instanceof ImageBlockModel)) return;

      host.doc.updateBlock(imageBlock, { caption });
      panel.hide();
    },
    icon: AIPenIcon,
    name: 'Use as caption',
    showWhen: () => {
      const panel = getAIPanel(host);
      return id === 'generateCaption' && !!panel.answer;
    },
  };
}

function createNewNote(host: EditorHost): AIItemConfig {
  return {
    handler: () => {
      reportResponse('result:add-note');
      // get the note block
      const { selectedBlocks } = getSelections(host);
      if (!selectedBlocks || !selectedBlocks.length) return;
      const firstBlock = selectedBlocks[0];
      const noteModel = findNoteBlockModel(firstBlock);
      if (!noteModel) return;

      // create a new note block at the left of the current note block
      const bound = Bound.deserialize(noteModel.xywh);
      const newBound = new Bound(bound.x - bound.w - 20, bound.y, bound.w, 72);
      const doc = host.doc;
      const panel = getAIPanel(host);
      const service = getService(host);
      doc.transact(() => {
        const noteBlockId = doc.addBlock(
          'affine:note',
          {
            displayMode: NoteDisplayMode.EdgelessOnly,
            index: service.generateIndex('affine:note'),
            xywh: newBound.serialize(),
          },
          doc.root!.id
        );

        insertFromMarkdown(host, panel.answer!, noteBlockId)
          .then(() => {
            service.selection.set({
              editing: false,
              elements: [noteBlockId],
            });

            // set the viewport to show the new note block and original note block
            const newNote = doc.getBlock(noteBlockId)?.model;
            if (!newNote || !matchFlavours(newNote, ['affine:note'])) return;
            const newNoteBound = Bound.deserialize(newNote.xywh);

            const bounds = [bound, newNoteBound];
            const { centerX, centerY, zoom } = service.getFitToScreenData(
              [20, 20, 20, 20],
              bounds
            );
            service.viewport.setViewport(zoom, [centerX, centerY]);
          })
          .catch(err => {
            console.error(err);
          });
      });
      // hide the panel
      panel.hide();
    },
    icon: CreateIcon,
    name: 'Create new note',
    showWhen: () => {
      const panel = getAIPanel(host);
      return !!panel.answer && isInsideEdgelessEditor(host);
    },
  };
}

export function buildTextResponseConfig<
  T extends keyof BlockSuitePresets.AIActions,
>(panel: AffineAIPanelWidget, id?: T) {
  const host = panel.host;

  const _replace = async () => {
    const selection = getSelection(host);
    if (!selection || !panel.answer) return;

    const { firstBlock, selectedModels, textSelection } = selection;
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
      items: [
        {
          handler: () => {
            reportResponse('result:insert');
            _insertBelow().catch(console.error);
          },
          icon: InsertBelowIcon,
          name: 'Insert below',
          showWhen: () =>
            !!panel.answer && (!id || !INSERT_ABOVE_ACTIONS.includes(id)),
        },
        {
          handler: () => {
            reportResponse('result:insert');
            _insertAbove().catch(console.error);
          },
          icon: InsertTopIcon,
          name: 'Insert above',
          showWhen: () =>
            !!panel.answer && !!id && INSERT_ABOVE_ACTIONS.includes(id),
        },
        useAsCaption(host, id),
        {
          handler: () => {
            reportResponse('result:replace');
            _replace().catch(console.error);
          },
          icon: ReplaceIcon,
          name: 'Replace selection',
          showWhen: () => !!panel.answer,
        },
        createNewNote(host),
      ],
      name: 'Response',
    },
    {
      items: [
        {
          handler: () => {
            reportResponse('result:continue-in-chat');
            AIProvider.slots.requestContinueInChat.emit({
              host: panel.host,
              show: true,
            });
            panel.hide();
          },
          icon: ChatWithAIIcon,
          name: 'Continue in chat',
        },
        {
          handler: () => {
            reportResponse('result:retry');
            panel.generate();
          },
          icon: RetryIcon,
          name: 'Regenerate',
        },
        {
          handler: () => {
            panel.discard();
          },
          icon: DiscardIcon,
          name: 'Discard',
        },
      ],
      name: '',
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

    const { firstBlock, selectedModels, textSelection } = selection;
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
      items: [
        {
          handler: () => {
            _replace().catch(console.error);
          },
          icon: ReplaceIcon,
          name: 'Replace selection',
          showWhen: () => !!panel.answer,
        },
        {
          handler: () => {
            _insertBelow().catch(console.error);
          },
          icon: InsertBelowIcon,
          name: 'Insert below',
          showWhen: () =>
            !!panel.answer && (!id || !INSERT_ABOVE_ACTIONS.includes(id)),
        },
        {
          handler: () => {
            reportResponse('result:insert');
            _insertAbove().catch(console.error);
          },
          icon: InsertTopIcon,
          name: 'Insert above',
          showWhen: () =>
            !!panel.answer && !!id && INSERT_ABOVE_ACTIONS.includes(id),
        },
        useAsCaption(host, id),
        createNewNote(host),
      ],
      name: 'Response',
    },
    {
      items: [
        {
          handler: () => {
            reportResponse('result:retry');
            panel.generate();
          },
          icon: RetryIcon,
          name: 'Retry',
          showWhen: () => true,
        },
        {
          handler: () => {
            panel.discard();
          },
          icon: DiscardIcon,
          name: 'Discard',
          showWhen: () => !!panel.answer,
        },
      ],
      name: '',
    },
  ];
}

export function buildFinishConfig<T extends keyof BlockSuitePresets.AIActions>(
  panel: AffineAIPanelWidget,
  id?: T
) {
  return {
    actions: [],
    responses: buildTextResponseConfig(panel, id),
  };
}

export function buildErrorConfig<T extends keyof BlockSuitePresets.AIActions>(
  panel: AffineAIPanelWidget,
  id?: T
) {
  return {
    cancel: () => {
      panel.hide();
    },
    login: () => {
      AIProvider.slots.requestLogin.emit({ host: panel.host });
      panel.hide();
    },
    responses: buildErrorResponseConfig(panel, id),
    upgrade: () => {
      AIProvider.slots.requestUpgradePlan.emit({ host: panel.host });
      panel.hide();
    },
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
    copy: buildCopyConfig(panel),
    errorStateConfig: buildErrorConfig(panel),
    finishStateConfig: buildFinishConfig(panel),
    generatingStateConfig: buildGeneratingConfig(),
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
