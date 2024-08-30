import {
  EmbedGithubBlockSchema,
  type EmbedGithubModel,
  EmbedGithubStyles,
} from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

import { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import { githubUrlRegex } from './embed-github-model.js';
import { queryEmbedGithubApiData, queryEmbedGithubData } from './utils.js';

export class EmbedGithubBlockService extends BlockService {
  private static readonly linkPreviewer = new LinkPreviewer();

  static override readonly flavour = EmbedGithubBlockSchema.model.flavour;

  static setLinkPreviewEndpoint =
    EmbedGithubBlockService.linkPreviewer.setEndpoint;

  queryApiData = (embedGithubModel: EmbedGithubModel, signal?: AbortSignal) => {
    return queryEmbedGithubApiData(embedGithubModel, signal);
  };

  queryUrlData = (embedGithubModel: EmbedGithubModel, signal?: AbortSignal) => {
    return queryEmbedGithubData(
      embedGithubModel,
      EmbedGithubBlockService.linkPreviewer,
      signal
    );
  };

  override mounted() {
    super.mounted();

    const rootService = this.std.spec.getService('affine:page');
    rootService.registerEmbedBlockOptions({
      flavour: this.flavour,
      urlRegex: githubUrlRegex,
      styles: EmbedGithubStyles,
      viewType: 'card',
    });
  }
}
