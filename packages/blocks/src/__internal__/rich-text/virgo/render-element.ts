import type { DeltaInsert, TextElement } from '@blocksuite/virgo';

import { AffineLink } from '../link-node/affine-link.js';
import { AffineText } from './affine-text.js';
import { affineTextAttributes } from './types.js';

export function renderElement(delta: DeltaInsert): TextElement {
  const parseResult = affineTextAttributes.optional().parse(delta.attributes);

  if (parseResult?.link) {
    const link = new AffineLink();
    link.delta = {
      insert: delta.insert,
      attributes: parseResult,
    };

    return link;
  }

  const affineText = new AffineText();
  affineText.delta = {
    insert: delta.insert,
    attributes: parseResult,
  };

  return affineText;
}
