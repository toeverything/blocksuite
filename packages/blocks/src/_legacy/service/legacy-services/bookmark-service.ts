import { WebIcon16 } from '../../../_common/icons/text.js';
import type { SerializedBlock } from '../../../_common/utils/types.js';
import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import { BookmarkDefaultImage } from '../../../bookmark-block/components/bookmark-default-image.js';
import { BaseService } from '../service.js';

export class BookmarkBlockService extends BaseService<BookmarkBlockModel> {
  override async block2html(block: BookmarkBlockModel) {
    const icon = block.icon
      ? `<img class="bookmark-icon" alt="icon" src="${block.icon}">`
      : this.templateResult2String(WebIcon16);
    const bookmarkCaption = block.caption
      ? `<figcaption class="affine-bookmark-caption">${block.caption}</figcaption>`
      : '';
    const banner = block.image
      ? `<img class="bookmark-image" alt="image" src="${block.image}">`
      : this.templateResult2String(BookmarkDefaultImage());
    return `
  <figure class="affine-bookmark-block-container">
    <a href="${block.url}" class="affine-bookmark-link bookmark source">
      <div class="affine-bookmark-content-wrapper">
        <div class="affine-bookmark-title">
          <div class="affine-bookmark-icon">
            ${icon}
          </div>
          <div class="affine-bookmark-title-content bookmark-title">${
            block.title || 'Bookmark'
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
  override block2Text(block: BookmarkBlockModel): string {
    return block.url;
  }

  override async block2markdown(block: BookmarkBlockModel) {
    return `[${block.title || 'Bookmark'}](${block.url})`;
  }

  override block2Json(
    block: BookmarkBlockModel,
    children: SerializedBlock[]
  ): SerializedBlock {
    const clonedProps = block.keys.reduce(
      (acc, key) => {
        // @ts-ignore
        acc[key] = block[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

    return {
      flavour: block.flavour,
      children,
      ...clonedProps,
    };
  }
}
