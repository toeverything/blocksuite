import type { BlockStdScope } from '@blocksuite/block-std';

import type {
  KeyboardSubToolbarConfig,
  KeyboardToolbarActionItem,
  KeyboardToolbarItem,
  KeyboardToolPanelConfig,
} from './config.js';

export function isKeyboardToolBarActionItem(
  item: KeyboardToolbarItem
): item is KeyboardToolbarActionItem {
  return 'action' in item;
}

export function isKeyboardSubToolBarConfig(
  item: KeyboardToolbarItem
): item is KeyboardSubToolbarConfig {
  return 'items' in item;
}

export function isKeyboardToolPanelConfig(
  item: KeyboardToolbarItem
): item is KeyboardToolPanelConfig {
  return 'groups' in item;
}

export function scrollCurrentBlockIntoView(std: BlockStdScope) {
  std.command
    .chain()
    .getSelectedModels()
    .inline(({ selectedModels }) => {
      if (!selectedModels?.length) return;

      const block = std.view.getBlock(selectedModels[0].id);
      if (!block) return;

      block.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
      });
    })
    .run();
}
