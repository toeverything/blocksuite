import type { ReferenceParams } from '@blocksuite/affine-model';
import { createIdentifier } from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';

export interface ParseDocUrlService {
  parseDocUrl: (
    url: string
  ) => ({ docId: string } & ReferenceParams) | undefined;
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
