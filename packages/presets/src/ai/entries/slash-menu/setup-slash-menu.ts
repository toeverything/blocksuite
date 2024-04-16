import { AffineSlashMenuWidget } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import { AIStarIcon } from '../../_common/icons.js';
import { handleAskAIAction } from '../../actions/handler.js';
import { AIProvider } from '../../provider.js';
import type { AffineAIPanelWidget } from '../../widgets/ai-panel/ai-panel.js';
import { AFFINE_AI_PANEL_WIDGET } from '../../widgets/ai-panel/ai-panel.js';

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
        action: ({ rootElement }) => {
          const view = rootElement.host.view;
          const affineAIPanelWidget = view.getWidget(
            AFFINE_AI_PANEL_WIDGET,
            rootElement.model.id
          ) as AffineAIPanelWidget;
          assertExists(affineAIPanelWidget);
          assertExists(AIProvider.actions.chat);
          handleAskAIAction(affineAIPanelWidget);
        },
      },
    ],
  });

  slashMenu.options = {
    ...AffineSlashMenuWidget.DEFAULT_OPTIONS,
    menus,
  };
}
