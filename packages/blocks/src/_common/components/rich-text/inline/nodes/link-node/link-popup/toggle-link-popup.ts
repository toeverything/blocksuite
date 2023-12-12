import './link-popup.js';

import type { InlineRange } from '@blocksuite/virgo';

import type { AffineInlineEditor } from '../../../types.js';
import { LinkPopup } from './link-popup.js';

export function toggleLinkPopup(
  inlineEditor: AffineInlineEditor,
  type: LinkPopup['type'],
  targetVRange: InlineRange
): LinkPopup {
  const popup = new LinkPopup();
  popup.inlineEditor = inlineEditor;
  popup.type = type;
  popup.targetVRange = targetVRange;

  document.body.appendChild(popup);

  return popup;
}
