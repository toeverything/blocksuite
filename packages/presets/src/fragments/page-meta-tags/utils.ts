import type { AffineTextAttributes } from '@blocksuite/blocks';
import type { PageMeta } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

export const PAGE_BLOCK_CHILD_PADDING = 24;

export const DEFAULT_PAGE_NAME = 'Untitled';

export type BackLink = {
  pageId: string;
  blockId: string;
  type: NonNullable<AffineTextAttributes['reference']>['type'];
};

export type BacklinkData = BackLink &
  PageMeta & {
    jump: () => void;
    icon: TemplateResult;
  };
