import './link-popup.js';

import type { VRange } from '@blocksuite/virgo';

import type { AffineVEditor } from '../../../types.js';
import { LinkPopup } from './link-popup.js';

export function toggleLinkPopup(
  vEditor: AffineVEditor,
  type: LinkPopup['type'],
  goalVRange: VRange
): LinkPopup {
  const popup = new LinkPopup();
  popup.vEditor = vEditor;
  popup.type = type;
  popup.goalVRange = goalVRange;

  document.body.appendChild(popup);

  return popup;
}
