import type { DocMode } from '@blocksuite/affine-model';
import type { ExtensionType } from '@blocksuite/block-std';

import { createIdentifier } from '@blocksuite/global/di';

export interface ParseDocUrlService {
  parseDocUrl: (url: string) =>
    | {
        docId: string;
        blockIds?: string[];
        elementIds?: string[];
        mode?: DocMode;
      }
    | undefined;
}

export const ParseDocUrlProvider =
  createIdentifier<ParseDocUrlService>('ParseDocUrlService');

export function ParseDocUrlExtension(
  parseDocUrlService: ParseDocUrlService
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(ParseDocUrlProvider, parseDocUrlService);
    },
  };
}
