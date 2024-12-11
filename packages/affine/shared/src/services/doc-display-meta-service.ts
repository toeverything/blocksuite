import type { ExtensionType } from '@blocksuite/block-std';
import type { Signal } from '@preact/signals-core';
import type { nothing, TemplateResult } from 'lit';

import { createIdentifier } from '@blocksuite/global/di';

/**
 * Customize document display title and icon.
 *
 * Supports the following blocks:
 *
 * * Inline View:
 *      `AffineReference`
 * * Card View:
 *      `EmbedLinkedDocBlockComponent`
 *      `EmbedEdgelessLinkedDocBlockComponent`
 * * Embed View:
 *      `EmbedSyncedDocBlockComponent`
 *      `EmbedEdgelessSyncedDocBlockComponent`
 */
export interface DocDisplayMetaService {
  title: (docId: string) => Signal<string>;
  icon: (docId: string) => Signal<TemplateResult | typeof nothing>;
}

export const DocDisplayMetaProvider = createIdentifier<DocDisplayMetaService>(
  'DocDisplayMetaService'
);

export function DocDisplayMetaExtension(
  docDisplayMetaProvider: DocDisplayMetaService
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(DocDisplayMetaProvider, docDisplayMetaProvider);
    },
  };
}
