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
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      abortController.abort();
      blockElement.download();
    },
    icon: DownloadIcon,
    name: 'download',
    showWhen: () => true,
    tooltip: 'Download',
    type: 'common',
  },
  {
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      abortController.abort();
      blockElement.captionEditor.show();
    },
    icon: CaptionIcon,
    name: 'caption',
    showWhen: blockElement => !blockElement.doc.readonly,
    tooltip: 'Caption',
    type: 'common',
  },
];

export const moreMenuConfig: MoreMenuConfigItem[] = [
  {
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      blockElement.convertToCardView();
      abortController.abort();
    },
    icon: BookmarkIcon,
    name: 'Turn into card view',
    showWhen: blockElement => {
      const doc = blockElement.doc;
      const supportAttachment =
        doc.schema.flavourSchemaMap.has('affine:attachment');
      const readonly = doc.readonly;
      return supportAttachment && !readonly && !!blockElement.blob;
    },
    tooltip: 'Turn into Card view',
    type: 'more',
  },
  {
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      blockElement.copy();
      abortController.abort();
    },
    icon: CopyIcon,
    name: 'Copy',
    showWhen: () => true,
    tooltip: 'Copy',
    type: 'more',
  },
  {
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      duplicate(blockElement, abortController);
    },
    icon: DuplicateIcon,
    name: 'Duplicate',
    showWhen: blockElement => !blockElement.doc.readonly,
    tooltip: 'Duplicate',
    type: 'more',
  },
  {
    showWhen: blockElement => !blockElement.doc.readonly,
    type: 'divider',
  },
  {
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      abortController.abort();
      blockElement.doc.deleteBlock(blockElement.model);
    },
    icon: DeleteIcon,
    name: 'Delete',
    showWhen: blockElement => !blockElement.doc.readonly,
    tooltip: 'Delete',
    type: 'more',
  },
];
