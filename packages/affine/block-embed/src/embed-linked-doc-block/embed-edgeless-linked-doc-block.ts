import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import { Bound } from '@blocksuite/global/utils';

import { toEdgelessEmbedBlock } from '../common/to-edgeless-embed-block.js';
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

    // @ts-expect-error TODO: fix after edgeless refactor
    const newId = edgelessService.addBlock(
      'affine:embed-synced-doc',
      { pageId, xywh: bound.serialize(), caption },
      // @ts-expect-error TODO: fix after edgeless refactor
      edgelessService.surface
    );

    this.std.command.exec('reassociateConnectors', {
      oldId: id,
      newId,
    });

    // @ts-expect-error TODO: fix after edgeless refactor
    edgelessService.selection.set({
      editing: false,
      elements: [newId],
    });

    doc.deleteBlock(this.model);
  };

  get rootService() {
    return this.std.getService('affine:page');
  }

  protected override _handleClick(evt: MouseEvent): void {
    if (this.config.handleClick) {
      this.config.handleClick(evt, this.host, this.referenceInfo);
      return;
    }
  }
}
