import type { InlineRange } from '@blocksuite/inline';

import type { AffineInlineEditor } from '../../../affine-inline-specs.js';

import { LinkPopup } from './link-popup.js';

export function toggleLinkPopup(
  inlineEditor: AffineInlineEditor,
  type: LinkPopup['type'],
  targetInlineRange: InlineRange,
  abortController: AbortController,
  openLink: ((e?: MouseEvent) => void) | null = null
): LinkPopup {
  const popup = new LinkPopup();
  popup.inlineEditor = inlineEditor;
  popup.type = type;
  popup.targetInlineRange = targetInlineRange;
  popup.openLink = openLink;
  popup.abortController = abortController;

  document.body.append(popup);

  return popup;
}
