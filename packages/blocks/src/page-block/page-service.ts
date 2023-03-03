import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import { getService } from '../__internal__/service.js';
import { BaseService } from '../__internal__/service/index.js';
import type { OpenBlockInfo } from '../__internal__/utils/index.js';
import type { PageBlockModel } from './page-model.js';

export class PageBlockService extends BaseService {
  override block2html(
    block: PageBlockModel,
    {
      childText = '',
      begin,
      end,
    }: {
      childText?: string;
      begin?: number;
      end?: number;
    } = {}
  ) {
    return `<div>${block.title.toString()}${childText}</div>`;
  }

  override block2Text(
    block: PageBlockModel,
    {
      childText = '',
      begin,
      end,
    }: {
      childText?: string;
      begin?: number;
      end?: number;
    } = {}
  ) {
    const text = (block.title.toString() || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }

  json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: OpenBlockInfo[]
  ): void {
    // this is page block empty case
    const frameId = focusedBlockModel.page.addBlockByFlavour(
      'affine:frame',
      {},
      focusedBlockModel.id
    );
    const frameModel = focusedBlockModel.page.getBlockById(frameId);
    assertExists(frameModel);
    const service = getService('affine:frame');
    service.json2Block(frameModel, pastedBlocks);
    // TODO: if page is not empty
  }
}
