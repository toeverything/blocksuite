import type { BlockModel } from '@blocksuite/store';

import { GfxPrimitiveElementModel } from '@blocksuite/block-std/gfx';

import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless/edgeless-root-block.js';
import type { EdgelessRootService } from '../../../edgeless/edgeless-root-service.js';
import type { EdgelessSelectionManager } from '../../../edgeless/services/selection-manager.js';

import { MoreMenuContext } from '../../../configs/toolbar.js';
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

export class ElementToolbarMoreMenuContext extends MoreMenuContext {
  #empty = true;

  #includedFrame = false;

  #multiple = false;

  #single = false;

  edgeless!: EdgelessRootBlockComponent;

  constructor(edgeless: EdgelessRootBlockComponent) {
    super();
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

  override isElement() {
    return (
      this.#single && this.firstElement instanceof GfxPrimitiveElementModel
    );
  }

  override isEmpty() {
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

  override get firstElement() {
    return this.selection.firstElement;
  }

  get host() {
    return this.edgeless.host;
  }

  get selectedBlockModels() {
    const [result, { selectedModels }] = this.std.command
      .chain()
      .getSelectedModels()
      .run();

    if (!result) return [];

    return selectedModels ?? [];
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

  get std() {
    return this.edgeless.host.std;
  }

  get surface(): SurfaceBlockComponent {
    return this.edgeless.surface;
  }

  get view() {
    return this.host.view;
  }
}
