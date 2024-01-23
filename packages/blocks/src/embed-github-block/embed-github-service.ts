import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import type { PageService } from '../index.js';
import {
  type EmbedGithubModel,
  EmbedGithubStyles,
  githubUrlRegex,
} from './embed-github-model.js';
import { queryEmbedGithubApiData, queryEmbedGithubData } from './utils.js';

export class EmbedGithubService extends BlockService<EmbedGithubModel> {
  private static readonly linkPreviewer = new LinkPreviewer();

  queryUrlData = (embedGithubModel: EmbedGithubModel) => {
    return queryEmbedGithubData(
      embedGithubModel,
      EmbedGithubService.linkPreviewer
    );
  };

  queryApiData = (embedGithubModel: EmbedGithubModel) => {
    return queryEmbedGithubApiData(embedGithubModel);
  };

  override mounted() {
    super.mounted();

    const pageService = this.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);
    pageService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: githubUrlRegex,
      styles: EmbedGithubStyles,
      viewType: 'card',
    });
  }

  static setLinkPreviewEndpoint = EmbedGithubService.linkPreviewer.setEndpoint;
}
