import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type { ImageConfigItem, MoreMenuConfigItem } from './type.js';

import { BookmarkIcon } from '../../../_common/icons/edgeless.js';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  DuplicateIcon,
} from '../../../_common/icons/text.js';
import { duplicate } from './utils.js';

export const commonConfig: ImageConfigItem[] = [
  {
    name: 'download',
    icon: DownloadIcon,
    tooltip: 'Download',
    showWhen: () => true,
    action: (block: ImageBlockComponent, abortController: AbortController) => {
      abortController.abort();
      block.download();
    },
    type: 'common',
  },
  {
    name: 'caption',
    icon: CaptionIcon,
    tooltip: 'Caption',
    showWhen: block => !block.doc.readonly,
    action: (block: ImageBlockComponent, abortController: AbortController) => {
      abortController.abort();
      block.captionEditor?.show();
    },
    type: 'common',
  },
];

export const moreMenuConfig: MoreMenuConfigItem[] = [
  {
    name: 'Turn into card view',
    icon: BookmarkIcon,
    tooltip: 'Turn into Card view',
    showWhen: block => {
      const doc = block.doc;
      const supportAttachment =
        doc.schema.flavourSchemaMap.has('affine:attachment');
      const readonly = doc.readonly;
      return supportAttachment && !readonly && !!block.blob;
    },
    action: (block: ImageBlockComponent, abortController: AbortController) => {
      block.convertToCardView();
      abortController.abort();
    },
    type: 'more',
  },
  {
    name: 'Copy',
    icon: CopyIcon,
    tooltip: 'Copy',
    showWhen: () => true,
    action: (block: ImageBlockComponent, abortController: AbortController) => {
      block.copy();
      abortController.abort();
    },
    type: 'more',
  },
  {
    name: 'Duplicate',
    icon: DuplicateIcon,
    tooltip: 'Duplicate',
    showWhen: block => !block.doc.readonly,
    action: (block: ImageBlockComponent, abortController: AbortController) => {
      duplicate(block, abortController);
    },
    type: 'more',
  },
  {
    type: 'divider',
    showWhen: block => !block.doc.readonly,
  },
  {
    name: 'Delete',
    icon: DeleteIcon,
    tooltip: 'Delete',
    showWhen: block => !block.doc.readonly,
    action: (block: ImageBlockComponent, abortController: AbortController) => {
      abortController.abort();
      block.doc.deleteBlock(block.model);
    },
    type: 'more',
  },
];
