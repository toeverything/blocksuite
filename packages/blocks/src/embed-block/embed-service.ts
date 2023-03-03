import { BaseService } from '../__internal__/service/index.js';
import type { OpenBlockInfo } from '../__internal__/utils/index.js';
import type { EmbedBlockModel } from './embed-model.js';
export class EmbedBlockService extends BaseService {
  override block2html(
    block: EmbedBlockModel,
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
    return `<figure><img src="${block.sourceId}" alt="${block.caption}"><figcaption>${block.caption}</figcaption></figure>`;
  }

  override block2Text(
    block: EmbedBlockModel,
    {
      childText = '',
      begin,
      end,
    }: { childText?: string; begin?: number; end?: number } = {}
  ): string {
    return block.caption;
  }

  override block2Json(
    block: EmbedBlockModel,
    begin?: number,
    end?: number
  ): OpenBlockInfo {
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
