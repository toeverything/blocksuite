import type {
  BlockTransformContext,
  SerializedBlock,
} from '../__internal__/index.js';
import { BaseService } from '../__internal__/service/service.js';
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
      ? `<img class="bookmark-icon" alt="icon" src="${block.icon}">`
      : this.templateResult2String(DefaultIcon);
    const bookmarkCaption = block.caption
      ? `<figcaption class="affine-bookmark-caption">${block.caption}</figcaption>`
      : '';
    const banner = block.image
      ? `<img class="bookmark-image" alt="image" src="${block.image}">`
      : this.templateResult2String(DefaultBanner);
    return `
  <figure class="affine-bookmark-block-container">
    <a href="${block.url}" class="affine-bookmark-link bookmark source">
      <div class="affine-bookmark-content-wrapper">
        <div class="affine-bookmark-title">
          <div class="affine-bookmark-icon">
            ${icon}
          </div>
          <div class="affine-bookmark-title-content bookmark-title">${
            block.bookmarkTitle || 'Bookmark'
          }</div>
        </div>
        <div class="affine-bookmark-description bookmark-description">${
          block.description || block.url
        }</div>
        <div class="affine-bookmark-url">${block.url}</div>
      </div>
      <div class="affine-bookmark-banner">
        ${banner}
      </div>
    </a>
    ${bookmarkCaption}
  </figure>
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
