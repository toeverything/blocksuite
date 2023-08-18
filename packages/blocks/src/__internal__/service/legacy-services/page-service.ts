import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import { TagsIcon } from '../../../icons/tags.js';
import type { PageBlockModel } from '../../../page-block/page-model.js';
import { DEFAULT_PAGE_NAME } from '../../rich-text/consts.js';
import type {
  BlockTransformContext,
  SerializedBlock,
} from '../../utils/index.js';
import { BaseService } from '../service.js';
import { getService } from '../singleton.js';

export class PageBlockService extends BaseService<PageBlockModel> {
  override async block2html(
    block: PageBlockModel,
    { childText = '' }: BlockTransformContext = {}
  ) {
    let pageMetaHtml = '';
    const tags = block.page.meta.tags ?? [];
    if (tags.length > 0) {
      const options = block.page.workspace.meta.properties.tags.options;
      const optionMap = Object.fromEntries(options.map(v => [v.id, v]));
      pageMetaHtml = `
        <div class="page-meta-data meta-data-expanded">
          <div class="meta-data-expanded-title">
            <div>Page info</div>
          </div>
          <div class="meta-data-expanded-content">
            <div class="meta-data-expanded-item">
              <div class="type">${this.templateResult2String(TagsIcon)}</div>
              <div class="value">
                <div class="tags">
                  ${(block.page.meta.tags ?? [])
                    .map(id => {
                      const tag = optionMap[id];
                      if (!tag) {
                        return '';
                      }
                      return `<div class="tag" style="background-color: ${tag.color}">${tag.value}</div>`;
                    })
                    .join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    return `<header><h1 class="page-title">${
      block.title.toString() ?? DEFAULT_PAGE_NAME
    }</h1>${pageMetaHtml}</header><div>${childText}</div>`;
  }

  override block2Text(
    block: PageBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    const text = (block.title.toString() || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }

  // todo we don't support link and database in page block title
  private _getAllSubTexts(block: SerializedBlock) {
    if (block.flavour === 'affine:database') {
      return [];
    }
    const texts = (block.text || []).filter(text => !text.attributes?.link);
    if (block.children) {
      block.children.forEach(child => {
        texts.push(...this._getAllSubTexts(child));
      });
    }
    return texts;
  }

  override async json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: SerializedBlock[]
  ) {
    if (
      pastedBlocks.length > 0 &&
      (pastedBlocks[0].children.length === 0 ||
        pastedBlocks[0].flavour === 'affine:page')
    ) {
      const titles = this._getAllSubTexts(pastedBlocks[0]);

      (focusedBlockModel as PageBlockModel).title.applyDelta(titles);
      pastedBlocks = pastedBlocks.slice(1);
    }
    // this is page block empty case
    const noteId = focusedBlockModel.page.addBlock(
      'affine:note',
      {},
      focusedBlockModel.id
    );
    const noteModel = focusedBlockModel.page.getBlockById(noteId);
    assertExists(noteModel);
    const service = getService('affine:note');
    service.json2Block(noteModel, pastedBlocks);
    // TODO: if page is not empty
  }
}
