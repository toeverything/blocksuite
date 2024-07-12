import type { AffineTextAttributes } from '@blocksuite/blocks';
import type { DocMeta } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

export const DOC_BLOCK_CHILD_PADDING = 24;

export const DEFAULT_DOC_NAME = 'Untitled';

export type BackLink = {
  blockId: string;
  pageId: string;
  type: NonNullable<AffineTextAttributes['reference']>['type'];
};

export type BacklinkData = {
  icon: TemplateResult;
  jump: () => void;
} & BackLink &
  DocMeta;
