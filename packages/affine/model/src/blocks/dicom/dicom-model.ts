import type {
  GfxCommonBlockProps,
  GfxElementGeometry,
} from '@blocksuite/std/gfx';
import { GfxCompatible } from '@blocksuite/std/gfx';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type { EmbedCardStyle } from '../../utils/index.js';
import { DicomBlockTransformer } from './dicom-transformer.js';

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

export const DicomBlockStyles: EmbedCardStyle[] = [
  'cubeThick',
  'horizontalThin',
  'pdf',
] as const;

export type DicomBlockProps = {
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

  style?: (typeof DicomBlockStyles)[number];
} & Omit<GfxCommonBlockProps, 'scale'>;

export const defaultDicomProps: DicomBlockProps = {
  name: '',
  size: 0,
  type: 'application/octet-stream',
  sourceId: undefined,
  caption: undefined,
  embed: false,
  style: DicomBlockStyles[1],
  index: 'a0',
  xywh: '[0,0,0,0]',
  lockedBySelf: false,
  rotate: 0,
};

export const DicomBlockSchema = defineBlockSchema({
  flavour: 'affine:dicom',
  props: (): DicomBlockProps => defaultDicomProps,
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'affine:note',
      'affine:surface',
      'affine:edgeless-text',
      'affine:paragraph',
      'affine:list',
    ],
  },
  transformer: transformerConfigs =>
      new DicomBlockTransformer(transformerConfigs),
  toModel: () => new DicomBlockModel(),
});

export class DicomBlockModel
  extends GfxCompatible<DicomBlockProps>(BlockModel)
  implements GfxElementGeometry {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:dicom': DicomBlockModel;
    }
    interface BlockModels {
      'affine:dicom': DicomBlockModel;
    }
  }
}