import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import type { EmbedCardStyle } from '../_common/types.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';
import { AttachmentBlockTransformer } from './attachment-transformer.js';

/**
 * When the attachment is uploading, the `sourceId` is `undefined`.
 * And we can query the upload status by the `isAttachmentLoading` function.
 *
 * Other collaborators will see an error attachment block when the blob has not finished uploading.
 * This issue can be resolve by sync the upload status through the awareness system in the future.
 *
 * When the attachment is uploaded, the `sourceId` is the id of the blob.
 *
 * If there are no `sourceId` and the `isAttachmentLoading` function returns `false`,
 * it means that the attachment is failed to upload.
 */

/**
 * @deprecated
 */
type BackwardCompatibleUndefined = undefined;

export const AttachmentBlockStyles: EmbedCardStyle[] = [
  'cubeThick',
  'horizontalThin',
] as const;

export interface AttachmentBlockEdgelessProps {
  index: string;
  xywh: SerializedXYWH;
  rotate: number;
}

export type AttachmentBlockProps = {
  name: string;
  size: number;
  /**
   * MIME type
   */
  type: string;
  caption?: string;
  // `loadingKey` was used to indicate whether the attachment is loading,
  // which is currently unused but no breaking change is needed.
  // The `loadingKey` and `sourceId` should not be existed at the same time.
  // loadingKey?: string | null;
  sourceId?: string;
  /**
   * Whether to show the attachment as an embed view.
   */
  embed: boolean | BackwardCompatibleUndefined;

  style?: (typeof AttachmentBlockStyles)[number];
} & AttachmentBlockEdgelessProps;

export const defaultAttachmentProps: AttachmentBlockProps = {
  name: '',
  size: 0,
  type: 'application/octet-stream',
  sourceId: undefined,
  caption: undefined,
  embed: false,
  style: AttachmentBlockStyles[1],
  index: 'a0',
  xywh: '[0,0,0,0]',
  rotate: 0,
};

export const AttachmentBlockSchema = defineBlockSchema({
  flavour: 'affine:attachment',
  props: (): AttachmentBlockProps => defaultAttachmentProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:note', 'affine:surface', 'affine:edgeless-text'],
  },
  transformer: () => new AttachmentBlockTransformer(),
  toModel: () => new AttachmentBlockModel(),
});

export class AttachmentBlockModel extends selectable<AttachmentBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:attachment': AttachmentBlockModel;
    }
  }
}
