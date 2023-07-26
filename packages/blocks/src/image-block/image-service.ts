import { BaseService } from '../__internal__/service/index.js';
import type {
  BlockTransformContext,
  SerializedBlock,
} from '../__internal__/utils/index.js';
import type { ImageBlockModel } from './image-model.js';
export class ImageBlockService extends BaseService<ImageBlockModel> {
  override block2html(
    block: ImageBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    return `<figure><img src="${block.sourceId}" alt="${block.caption}"><figcaption>${block.caption}</figcaption></figure>`;
  }

  override block2Text(
    block: ImageBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ): string {
    return block.caption;
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
