import type { ReferenceInfo } from '@blocksuite/affine-model';

import { createIdentifier } from '@blocksuite/global/di';

export interface QuickSearchService {
  searchDoc: (options: {
    action?: 'insert';
    userInput?: string;
    skipSelection?: boolean;
    trigger?: 'edgeless-toolbar' | 'slash-command' | 'shortcut';
  }) => Promise<QuickSearchResult>;
}

export type QuickSearchResult =
  | ({
      docId: string;
      isNewDoc?: boolean;
    } & Omit<ReferenceInfo, 'pageId'>)
  | { userInput: string }
  | null;

export const QuickSearchProvider = createIdentifier<QuickSearchService>(
  'AffineQuickSearchService'
);
