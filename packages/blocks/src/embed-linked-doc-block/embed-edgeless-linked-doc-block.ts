import { EmbedLinkedDocStyles } from '@blocksuite/affine-model';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import { Bound } from '@blocksuite/global/utils';

import type { EdgelessRootService } from '../root-block/index.js';

import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedLinkedDocBlockComponent } from './embed-linked-doc-block.js';

export class EmbedEdgelessLinkedDocBlockComponent extends toEdgelessEmbedBlock(
  EmbedLinkedDocBlockComponent
) {
  override convertToEmbed = () => {
    const { id, doc, pageId, caption, xywh } = this.model;

    // synced doc entry controlled by awareness flag
    const isSyncedDocEnabled = doc.awarenessStore.getFlag(
      'enable_synced_doc_block'
    );
    if (!isSyncedDocEnabled) {
      return;
    }

    const style = 'syncedDoc';
    const bound = Bound.deserialize(xywh);
    bound.w = EMBED_CARD_WIDTH[style];
    bound.h = EMBED_CARD_HEIGHT[style];

    const edgelessService = this.rootService;

    if (!edgelessService) {
      return;
    }

    const newId = edgelessService.addBlock(
      'affine:embed-synced-doc',
      { pageId, xywh: bound.serialize(), caption },
      edgelessService.surface
    );

    this.std.command.exec('reassociateConnectors', {
      oldId: id,
      newId,
    });

    edgelessService.selection.set({
      editing: false,
      elements: [newId],
    });

    doc.deleteBlock(this.model);
  };

  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }

  protected override _handleClick(evt: MouseEvent): void {
    if (this.config.handleClick) {
      this.config.handleClick(evt, this.host);
      return;
    }
  }

  override renderGfxBlock() {
    const { style$ } = this.model;
    const cardStyle = style$.value ?? EmbedLinkedDocStyles[1];
    const width = EMBED_CARD_WIDTH[cardStyle];
    const height = EMBED_CARD_HEIGHT[cardStyle];
    const bound = this.model.elementBound;
    const scaleX = bound.w / width;
    const scaleY = bound.h / height;

    this.embedContainerStyle.width = `${width}px`;
    this.embedContainerStyle.height = `${height}px`;
    this.embedContainerStyle.transform = `scale(${scaleX}, ${scaleY})`;

    return this.renderPageContent();
  }
}
