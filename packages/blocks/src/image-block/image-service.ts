import { BaseService } from '../__internal__/service/index.js';
import type {
  BlockTransformContext,
  SerializedBlock,
} from '../__internal__/utils/index.js';
import type { ImageBlockModel } from './image-model.js';
export class ImageBlockService extends BaseService<ImageBlockModel> {
  override async block2html(
    block: ImageBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {},
    blobMap?: Map<string, string>
  ) {
    const blobId = block.sourceId;
    let imageSrc = blobId;
    if (blobMap) {
      if (blobMap.has(blobId)) {
        imageSrc = blobMap.get(blobId) ?? '';
      } else {
        const blob = await block.page.blobs.get(blobId);
        if (blob) {
          imageSrc = `images/${blobId}.${blob.type.split('/')[1]}`;
          blobMap.set(blobId, imageSrc);
        }
      }
    }
    return `<figure><img src="${imageSrc}" alt="${block.caption}"><figcaption>${block.caption}</figcaption></figure>`;
  }

  override block2Text(
    block: ImageBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ): string {
    return block.caption ?? '';
  }

  override block2Json(
    block: ImageBlockModel,
    selectedModels?: Map<string, number>,
    begin?: number,
    end?: number
  ): SerializedBlock {
    return {
      type: block.type,
      sourceId: block.sourceId,
      width: block.width,
      height: block.height,
      caption: block.caption,
      flavour: block.flavour,
      children: [],
    };
  }
}
