// Setup for default proportional elements

import { EMBED_CARD_HEIGHT } from '../../../../../../_common/consts.js';
import { AttachmentBlockModel } from '../../../../../../attachment-block/attachment-model.js';
import { BookmarkBlockModel } from '../../../../../../bookmark-block/bookmark-model.js';
import { EmbedFigmaModel } from '../../../../../../embed-figma-block/embed-figma-model.js';
import { EmbedGithubModel } from '../../../../../../embed-github-block/embed-github-model.js';
import { EmbedLinkedDocModel } from '../../../../../../embed-linked-doc-block/embed-linked-doc-model.js';
import { EmbedLoomModel } from '../../../../../../embed-loom-block/embed-loom-model.js';
import { EmbedYoutubeModel } from '../../../../../../embed-youtube-block/embed-youtube-model.js';
import { getProportionalController } from './proportional-controller.js';
import { EdgelessTransformableRegistry } from './transform-controller.js';

getProportionalController<BlockSuite.EdgelessModelType>(
  el => EMBED_CARD_HEIGHT[(el as BookmarkBlockModel).style]
);

const elementsWithCardStyle = [
  AttachmentBlockModel,
  BookmarkBlockModel,
  EmbedFigmaModel,
  EmbedGithubModel,
  EmbedYoutubeModel,
  EmbedLoomModel,
  EmbedLinkedDocModel,
];

elementsWithCardStyle.forEach(el => {
  EdgelessTransformableRegistry.register(
    el,
    getProportionalController<BlockSuite.EdgelessModelType>(
      el => EMBED_CARD_HEIGHT[(el as BookmarkBlockModel).style]
    )
  );
});
