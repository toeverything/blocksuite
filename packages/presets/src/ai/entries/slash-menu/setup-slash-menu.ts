import type { AffineAIPanelWidget } from '@blocksuite/blocks';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineSlashMenuWidget,
  AIStarIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

import { handleAskAIAction } from '../../config/builder.js';
import type { AIConfig } from '../../types.js';

export function setupSlashMenuEntry(
  slashMenu: AffineSlashMenuWidget,
  { getAskAIStream }: AIConfig
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
        action: ({ rootElement }) => {
          const view = rootElement.host.view;
          const affineAIPanelWidget = view.getWidget(
            AFFINE_AI_PANEL_WIDGET,
            rootElement.model.id
          ) as AffineAIPanelWidget;
          assertExists(affineAIPanelWidget);
          assertExists(getAskAIStream);
          handleAskAIAction(affineAIPanelWidget, getAskAIStream);
        },
      },
    ],
  });

  slashMenu.options = {
    ...AffineSlashMenuWidget.DEFAULT_OPTIONS,
    menus,
  };
}
