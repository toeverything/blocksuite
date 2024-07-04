import { BookmarkIcon } from '../../../_common/icons/edgeless.js';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  DuplicateIcon,
} from '../../../_common/icons/text.js';
import type { ImageBlockComponent } from '../../../image-block/image-block.js';
import type { ImageConfigItem, MoreMenuConfigItem } from './type.js';
import { duplicate } from './utils.js';

export const commonConfig: ImageConfigItem[] = [
  {
    name: 'download',
    icon: DownloadIcon,
    tooltip: 'Download',
    showWhen: () => true,
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      abortController.abort();
      blockElement.download();
    },
    type: 'common',
  },
  {
    name: 'caption',
    icon: CaptionIcon,
    tooltip: 'Caption',
    showWhen: blockElement => !blockElement.doc.readonly,
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      abortController.abort();
      blockElement.captionEditor.show();
    },
    type: 'common',
  },
];

export const moreMenuConfig: MoreMenuConfigItem[] = [
  {
    name: 'Turn into card view',
    icon: BookmarkIcon,
    tooltip: 'Turn into Card view',
    showWhen: blockElement => {
      const doc = blockElement.doc;
      const supportAttachment =
        doc.schema.flavourSchemaMap.has('affine:attachment');
      const readonly = doc.readonly;
      return supportAttachment && !readonly && !!blockElement.blob;
    },
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      blockElement.convertToCardView();
      abortController.abort();
    },
    type: 'more',
  },
  {
    name: 'Copy',
    icon: CopyIcon,
    tooltip: 'Copy',
    showWhen: () => true,
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      blockElement.copy();
      abortController.abort();
    },
    type: 'more',
  },
  {
    name: 'Duplicate',
    icon: DuplicateIcon,
    tooltip: 'Duplicate',
    showWhen: blockElement => !blockElement.doc.readonly,
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      duplicate(blockElement, abortController);
    },
    type: 'more',
  },
  {
    type: 'divider',
    showWhen: blockElement => !blockElement.doc.readonly,
  },
  {
    name: 'Delete',
    icon: DeleteIcon,
    tooltip: 'Delete',
    showWhen: blockElement => !blockElement.doc.readonly,
    action: (
      blockElement: ImageBlockComponent,
      abortController: AbortController
    ) => {
      abortController.abort();
      blockElement.doc.deleteBlock(blockElement.model);
    },
    type: 'more',
  },
];
