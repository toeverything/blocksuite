import type { BlockSpec } from '@blocksuite/block-std';

import type { FontConfig } from '../../root-block/font-loader/font-loader.js';
import { EdgelessRootBlockComponent } from '../../root-block/index.js';
import type { EdgelessRootBlockWidgetName } from '../base/edgeless-root.js';

export function patchEdgelessSpecWithFont(
  spec: BlockSpec<EdgelessRootBlockWidgetName>,
  fonts: FontConfig[]
): BlockSpec<EdgelessRootBlockWidgetName> {
  return {
    ...spec,
    setup: (slots, disposableGroup) => {
      spec.setup?.(slots, disposableGroup);

      slots.viewConnected.once(v => {
        if (v.component instanceof EdgelessRootBlockComponent) {
          const edgeless = v.component;
          edgeless.service.fontLoader.load(fonts);
        }
      });
    },
  };
}
