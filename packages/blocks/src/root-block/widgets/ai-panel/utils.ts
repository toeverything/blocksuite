import type { EditorHost } from '@blocksuite/block-std';

import { isInsidePageEditor } from '@blocksuite/affine-shared/utils';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';

export function filterAIItemGroup(
  host: EditorHost,
  configs: AIItemGroupConfig[]
): AIItemGroupConfig[] {
  const editorMode = isInsidePageEditor(host) ? 'page' : 'edgeless';
  return configs
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.showWhen
          ? item.showWhen(host.command.chain(), editorMode, host)
          : true
      ),
    }))
    .filter(group => group.items.length > 0);
}
