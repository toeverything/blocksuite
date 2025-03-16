import type { ReferenceInfo } from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { InlineRange } from '@blocksuite/inline';

import type { AffineInlineEditor } from '../../../affine-inline-specs';
import { ReferencePopup } from './reference-popup';

export function toggleReferencePopup(
  std: BlockStdScope,
  docTitle: string,
  referenceInfo: ReferenceInfo,
  inlineEditor: AffineInlineEditor,
  inlineRange: InlineRange,
  abortController: AbortController
): ReferencePopup {
  const popup = new ReferencePopup();
  popup.std = std;
  popup.docTitle = docTitle;
  popup.referenceInfo = referenceInfo;
  popup.inlineEditor = inlineEditor;
  popup.inlineRange = inlineRange;
  popup.abortController = abortController;

  document.body.append(popup);

  return popup;
}
