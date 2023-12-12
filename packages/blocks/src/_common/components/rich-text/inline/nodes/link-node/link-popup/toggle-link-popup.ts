import './link-popup.js';

import type { InlineRange } from '@blocksuite/inline';

import type { AffineInlineEditor } from '../../../types.js';
import { LinkPopup } from './link-popup.js';

export function toggleLinkPopup(
  inlineEditor: AffineInlineEditor,
  type: LinkPopup['type'],
  targetInlineRange: InlineRange
): LinkPopup {
  const popup = new LinkPopup();
  popup.inlineEditor = inlineEditor;
  popup.type = type;
  popup.targetInlineRange = targetInlineRange;

  document.body.appendChild(popup);

  return popup;
}
