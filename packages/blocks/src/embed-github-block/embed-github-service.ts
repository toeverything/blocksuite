import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { PageService } from '../index.js';
import { type EmbedGithubModel, githubUrlRegex } from './embed-github-model.js';
import { queryEmbedGithubData, type QueryUrlData } from './utils.js';

export class EmbedGithubService extends BlockService<EmbedGithubModel> {
  queryUrlData: QueryUrlData = (embedGithubModel: EmbedGithubModel) => {
    return queryEmbedGithubData(embedGithubModel);
  };

  override mounted() {
    super.mounted();

    const pageService = this.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);
    pageService.registerEmbedBlockOptions(this.flavour, {
      urlRegex: githubUrlRegex,
      styles: ['horizontal', 'list', 'vertical', 'cube'],
    });
  }
}
