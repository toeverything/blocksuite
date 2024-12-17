import type { ReferenceParams } from '@blocksuite/affine-model';
import type { ExtensionType } from '@blocksuite/block-std';

import { createIdentifier } from '@blocksuite/global/di';

export interface GenerateDocUrlService {
  generateDocUrl: (docId: string, params?: ReferenceParams) => string | void;
}

export const GenerateDocUrlProvider = createIdentifier<GenerateDocUrlService>(
  'GenerateDocUrlService'
);

export function GenerateDocUrlExtension(
  generateDocUrlProvider: GenerateDocUrlService
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(GenerateDocUrlProvider, generateDocUrlProvider);
    },
  };
}
