import type { AffineAIPanelWidget } from '@blocksuite/blocks';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineSlashMenuWidget,
  AIStarIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import { CopilotClient } from '../../copilot-client.js';
import { createDefaultPanelConfig } from '../entry-utils.js';

export function setupSlashMenuEntry(slashMenu: AffineSlashMenuWidget) {
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
            const copilotClient = new CopilotClient('http://localhost:3010');

            panel.config = createDefaultPanelConfig(panel, copilotClient);
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
