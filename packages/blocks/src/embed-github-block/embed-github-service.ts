import { BlockService } from '@blocksuite/block-std';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import {
  type EmbedGithubModel,
  EmbedGithubStyles,
  githubUrlRegex,
} from './embed-github-model.js';
import { queryEmbedGithubApiData, queryEmbedGithubData } from './utils.js';

export class EmbedGithubBlockService extends BlockService<EmbedGithubModel> {
  private static readonly linkPreviewer = new LinkPreviewer();

  queryUrlData = (embedGithubModel: EmbedGithubModel) => {
    return queryEmbedGithubData(
      embedGithubModel,
      EmbedGithubBlockService.linkPreviewer
    );
  };

  queryApiData = (embedGithubModel: EmbedGithubModel) => {
    return queryEmbedGithubApiData(embedGithubModel);
  };

  override mounted() {
    super.mounted();

    this.std.spec.slots.afterApply.once(() => {
      const rootService = this.std.spec.getService('affine:page');
      rootService.registerEmbedBlockOptions({
        flavour: this.flavour,
        urlRegex: githubUrlRegex,
        styles: EmbedGithubStyles,
        viewType: 'card',
      });
    });
  }

  static setLinkPreviewEndpoint =
    EmbedGithubBlockService.linkPreviewer.setEndpoint;
}
