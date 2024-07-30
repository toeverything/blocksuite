import type {
  AIItemConfig,
  AffineAIPanelWidget,
  AffineSlashMenuActionItem,
  AffineSlashMenuContext,
  AffineSlashMenuItem,
  AffineSlashSubMenu,
} from '@blocksuite/blocks';

import {
  AFFINE_AI_PANEL_WIDGET,
  AIStarIcon,
  AffineSlashMenuWidget,
  MoreHorizontalIcon,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { html } from 'lit';

import { AIItemGroups } from '../../_common/config.js';
import { handleInlineAskAIAction } from '../../actions/doc-handler.js';
import { AIProvider } from '../../provider.js';

export function setupSlashMenuEntry(slashMenu: AffineSlashMenuWidget) {
  const AIItems = AIItemGroups.map(group => group.items).flat();

  const iconWrapper = (icon: AIItemConfig['icon']) => {
    return html`<div style="color: var(--affine-primary-color)">
      ${typeof icon === 'function' ? html`${icon()}` : icon}
    </div>`;
  };

  const showWhenWrapper =
    (item?: AIItemConfig) =>
    ({ rootComponent }: AffineSlashMenuContext) => {
      const affineAIPanelWidget = rootComponent.host.view.getWidget(
        AFFINE_AI_PANEL_WIDGET,
        rootComponent.model.id
      );
      if (affineAIPanelWidget === null) return false;

      const chain = rootComponent.host.command.chain();
      const editorMode = rootComponent.service.docModeService.getMode(
        rootComponent.doc.id
      );

      return item?.showWhen?.(chain, editorMode, rootComponent.host) ?? true;
    };

  const actionItemWrapper = (
    item: AIItemConfig
  ): AffineSlashMenuActionItem => ({
    ...basicItemConfig(item),
    action: ({ rootComponent }: AffineSlashMenuContext) => {
      item?.handler?.(rootComponent.host);
    },
  });

  const subMenuWrapper = (item: AIItemConfig): AffineSlashSubMenu => {
    assertExists(item.subItem);
    return {
      ...basicItemConfig(item),
      subMenu: item.subItem.map<AffineSlashMenuActionItem>(
        ({ type, handler }) => ({
          name: type,
          action: ({ rootComponent }) => handler?.(rootComponent.host),
        })
      ),
    };
  };

  const basicItemConfig = (item: AIItemConfig) => {
    return {
      name: item.name,
      icon: iconWrapper(item.icon),
      alias: ['ai'],
      showWhen: showWhenWrapper(item),
    };
  };

  const AIMenuItems: AffineSlashMenuItem[] = [
    { groupName: 'AFFiNE AI' },
    {
      name: 'Ask AI',
      icon: AIStarIcon,
      showWhen: showWhenWrapper(),
      action: ({ rootComponent }) => {
        const view = rootComponent.host.view;
        const affineAIPanelWidget = view.getWidget(
          AFFINE_AI_PANEL_WIDGET,
          rootComponent.model.id
        ) as AffineAIPanelWidget;
        assertExists(affineAIPanelWidget);
        assertExists(AIProvider.actions.chat);
        assertExists(affineAIPanelWidget.host);
        handleInlineAskAIAction(affineAIPanelWidget.host);
      },
    },

    ...AIItems.filter(({ name }) =>
      ['Fix grammar', 'Fix spelling'].includes(name)
    ).map(item => ({
      ...actionItemWrapper(item),
      name: `${item.name} from above`,
    })),

    ...AIItems.filter(({ name }) =>
      ['Continue writing', 'Summarize'].includes(name)
    ).map(actionItemWrapper),

    {
      name: 'Action with above',
      icon: iconWrapper(MoreHorizontalIcon),
      subMenu: [
        { groupName: 'Action with above' },
        ...AIItems.filter(({ name }) =>
          ['Change tone to', 'Translate to'].includes(name)
        ).map(subMenuWrapper),

        ...AIItems.filter(({ name }) =>
          [
            'Find actions',
            'Generate outline',
            'Improve writing',
            'Make it longer',
            'Make it shorter',
          ].includes(name)
        ).map(actionItemWrapper),
      ],
    },
  ];

  const menu = slashMenu.config.items.slice();
  menu.unshift(...AIMenuItems);

  slashMenu.config = {
    ...AffineSlashMenuWidget.DEFAULT_CONFIG,
    items: menu,
  };
}
