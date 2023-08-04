import type {
  BlockTransformContext,
  SerializedBlock,
} from '../__internal__/index.js';
import { BaseService } from '../__internal__/service/index.js';
import type { BookmarkBlockModel } from './bookmark-model.js';
import { DefaultBanner } from './images/banners.js';
import { DefaultIcon } from './images/icons.js';
import { cloneBookmarkProperties } from './utils.js';

export class BookmarkBlockService extends BaseService<BookmarkBlockModel> {
  override async block2html(
    block: BookmarkBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    const icon = block.icon
      ? `<img alt="icon" src="${block.icon}">`
      : DefaultIcon.strings.join('');
    const bookmarkCaption = block.caption
      ? `<div class="affine-bookmark-caption">${block.caption}</div>`
      : '';
    const banner = block.image
      ? `<div class="affine-bookmark-banner shadow"><img alt="image" src="${block.image}"></div>`
      : DefaultBanner.strings.join('');
    return `
  <div class="affine-bookmark-block-container">
    <div class="affine-bookmark-link">
      <div class="affine-bookmark-content-wrapper">
        <div class="affine-bookmark-title">
          <div class="affine-bookmark-icon">
            ${icon}
          </div>
          <div class="affine-bookmark-title-content">
            ${block.bookmarkTitle || 'Bookmark'}
          </div>
        </div>
        <div class="affine-bookmark-description">${
          block.description || block.url
        }</div>
        <div class="affine-bookmark-url">${block.url}</div>
      </div>
      <div class="affine-bookmark-banner">
        ${banner}
      </div>
    </div>
    ${bookmarkCaption}
  </div>
`;
  }
  override block2Text(
    block: BookmarkBlockModel,
    { childText = '', begin = 0, end }: BlockTransformContext = {}
  ): string {
    return block.url;
  }

  override block2Json(
    block: BookmarkBlockModel,
    selectedModels?: Map<string, number>,
    begin?: number,
    end?: number
  ): SerializedBlock {
    const clonedProps = cloneBookmarkProperties(block);

    return {
      flavour: block.flavour,
      children: [],
      ...clonedProps,
    };
  }
}
