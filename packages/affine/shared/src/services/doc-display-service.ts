import type { ExtensionType } from '@blocksuite/block-std';
import type { Signal } from '@preact/signals-core';
import type { nothing, TemplateResult } from 'lit';

import { createIdentifier } from '@blocksuite/global/di';

/**
 * Customize document display title and icon.
 *
 * Supports the following blocks：
 *
 * * inline view:
 *      `AffineReference`
 * * card view:
 *      `EmbedLinkedDocBlockComponent`
 *      `EmbedEdgelessLinkedDocBlockComponent`
 * * embed view:
 *      `EmbedSyncedDocBlockComponent`
 *      `EmbedEdgelessSyncedDocBlockComponent`
 */
export interface DocDisplayService {
  title: (docId: string) => Signal<string>;
  icon: (docId: string) => Signal<TemplateResult | typeof nothing>;
}

export const DocDisplayProvider =
  createIdentifier<DocDisplayService>('DocDisplayService');

export function DocDisplayExtension(
  docDisplayProvider: DocDisplayService
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(DocDisplayProvider, docDisplayProvider);
    },
  };
}
