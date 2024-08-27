import type { BlockModel } from '@blocksuite/store';

import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless/edgeless-root-block.js';
import type { EdgelessRootService } from '../../../edgeless/edgeless-root-service.js';
import type { EdgelessSelectionManager } from '../../../edgeless/services/selection-manager.js';

import {
  isAttachmentBlock,
  isBookmarkBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
  isEmbeddedLinkBlock,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
} from '../../../edgeless/utils/query.js';

export class MoreMenuContext {
  #empty = true;

  #includedFrame = false;

  #multiple = false;

  #single = false;

  edgeless!: EdgelessRootBlockComponent;

  constructor(edgeless: EdgelessRootBlockComponent) {
    this.edgeless = edgeless;

    const selectedElements = this.selection.selectedElements;
    const len = selectedElements.length;

    this.#empty = len === 0;
    this.#single = len === 1;
    this.#multiple = !this.#empty && !this.#single;
    this.#includedFrame = !this.#empty && selectedElements.some(isFrameBlock);
  }

  getBlockComponent(id: string) {
    return this.view.getBlock(id);
  }

  getLinkedDocBlock() {
    const valid =
      this.#single &&
      (isEmbedLinkedDocBlock(this.firstElement) ||
        isEmbedSyncedDocBlock(this.firstElement));

    if (!valid) return null;

    return this.firstElement;
  }

  getNoteBlock() {
    const valid = this.#single && isNoteBlock(this.firstElement);

    if (!valid) return null;

    return this.firstElement;
  }

  hasFrame() {
    return this.#includedFrame;
  }

  isEmpty() {
    return this.#empty;
  }

  isMultiple() {
    return this.#multiple;
  }

  isSingle() {
    return this.#single;
  }

  refreshable(model: BlockModel) {
    return (
      isImageBlock(model) ||
      isBookmarkBlock(model) ||
      isAttachmentBlock(model) ||
      isEmbeddedLinkBlock(model)
    );
  }

  get doc() {
    return this.edgeless.doc;
  }

  get firstBlockComponent() {
    return this.getBlockComponent(this.firstElement.id);
  }

  get firstElement() {
    return this.selection.firstElement;
  }

  get host() {
    return this.edgeless.host;
  }

  get selectedElements() {
    return this.selection.selectedElements;
  }

  get selection(): EdgelessSelectionManager {
    return this.service.selection;
  }

  get service(): EdgelessRootService {
    return this.edgeless.service;
  }

  get surface(): SurfaceBlockComponent {
    return this.edgeless.surface;
  }

  get view() {
    return this.host.view;
  }
}
