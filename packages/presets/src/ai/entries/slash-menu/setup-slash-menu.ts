import type {
  AffineAIPanelWidget,
  AffineAIPanelWidgetConfig,
} from '@blocksuite/blocks';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineSlashMenuWidget,
  AIStarIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import { bindEventSource } from '../../config/builder.js';
import type { AIConfig } from '../../types.js';

export function setupSlashMenuEntry(
  slashMenu: AffineSlashMenuWidget,
  getAskAIStream: NonNullable<AIConfig['getAskAIStream']>
) {
  const menus = slashMenu.options.menus.slice();
  menus.unshift({
    name: 'AI',
    items: [
      {
        name: 'Ask AI',
        icon: AIStarIcon,
        showWhen: (_, rootElement) => {
          const affineAIPanelWidget = rootElement.host.view.getWidget(
            AFFINE_AI_PANEL_WIDGET,
            rootElement.model.id
          );
          return !!affineAIPanelWidget;
        },
        action: ({ rootElement, model }) => {
          const view = rootElement.host.view;
          const affineAIPanelWidget = view.getWidget(
            AFFINE_AI_PANEL_WIDGET,
            rootElement.model.id
          );
          assertExists(affineAIPanelWidget);
          requestAnimationFrame(() => {
            const block = view.getBlock(model.id);
            assertExists(block);
            const panel = affineAIPanelWidget as AffineAIPanelWidget;
            const host = panel.host;
            const generateAnswer: AffineAIPanelWidgetConfig['generateAnswer'] =
              ({ finish, input, signal, update }) => {
                getAskAIStream(host.doc, input)
                  .then(stream => {
                    bindEventSource(stream, { update, finish, signal });
                  })
                  .catch(console.error);
              };
            assertExists(panel.config);
            panel.config.generateAnswer = generateAnswer;
            panel.toggle(block);
          });
        },
      },
    ],
  });

  slashMenu.options = {
    ...AffineSlashMenuWidget.DEFAULT_OPTIONS,
    menus,
  };
}
