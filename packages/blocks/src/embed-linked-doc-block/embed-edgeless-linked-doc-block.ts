import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import { Bound } from '@blocksuite/global/utils';
import { customElement } from 'lit/decorators.js';

import type { EdgelessRootService } from '../root-block/index.js';

import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedLinkedDocBlockComponent } from './embed-linked-doc-block.js';

@customElement('affine-embed-edgeless-linked-doc-block')
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

  protected override _handleClick(evt: MouseEvent): void {
    if (this.config.handleClick) {
      this.config.handleClick(evt, this.host);
      return;
    }
  }

  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }
}
