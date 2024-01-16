import './link-popup.js';

import type { InlineRange } from '@blocksuite/inline';

import type { AffineInlineEditor } from '../../../affine-inline-specs.js';
import { LinkPopup } from './link-popup.js';

export function toggleLinkPopup(
  inlineEditor: AffineInlineEditor,
  type: LinkPopup['type'],
  targetInlineRange: InlineRange,
  abortController: AbortController
): LinkPopup {
  const popup = new LinkPopup();
  popup.inlineEditor = inlineEditor;
  popup.type = type;
  popup.targetInlineRange = targetInlineRange;
  popup.abortController = abortController;

  document.body.appendChild(popup);

  return popup;
}
