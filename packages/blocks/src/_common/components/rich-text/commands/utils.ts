import type { Command } from '@blocksuite/block-std';
import { assertInstanceOf } from '@blocksuite/global/utils';
import { EditorHost } from '@blocksuite/lit';

import { handleCommonStyle } from '../../../configs/text-format/utils.js';
import type { AffineTextAttributes } from '../../../inline/presets/affine-inline-specs.js';

export function getTextStyleCommand(
  key: Extract<
    keyof AffineTextAttributes,
    'bold' | 'italic' | 'underline' | 'strike' | 'code'
  >
): Command {
  return (ctx, next) => {
    const host = ctx.std.host;
    assertInstanceOf(host, EditorHost);
    const [result] = handleCommonStyle(host, key);

    if (result) {
      return next();
    }

    return false;
  };
}
