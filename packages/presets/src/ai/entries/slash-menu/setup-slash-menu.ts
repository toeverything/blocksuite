import type { AffineAIPanelWidget } from '@blocksuite/blocks';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineSlashMenuWidget,
  AIStarIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

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
