/// <reference types="vite/client" />
import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { css, html, render } from 'lit';
import { customElement } from 'lit/decorators.js';

import { matchFlavours } from '../_common/utils/index.js';
import type { DragHandleOption } from '../page-block/widgets/drag-handle/config.js';
import {
  AFFINE_DRAG_HANDLE_WIDGET,
  AffineDragHandleWidget,
} from '../page-block/widgets/drag-handle/drag-handle.js';
import { captureEventTarget } from '../page-block/widgets/drag-handle/utils.js';
import { KeymapController } from './keymap-controller.js';
import { type NoteBlockModel, NoteBlockSchema } from './note-model.js';

@customElement('affine-note')
export class NoteBlockComponent extends BlockElement<NoteBlockModel> {
  static override styles = css`
    .affine-note-block-container {
      display: flow-root;
      position: relative;
    }
    .affine-note-block-container.selected {
      background-color: var(--affine-hover-color);
    }
  `;

  keymapController = new KeymapController(this);

  private _dragHandleOption: DragHandleOption = {
    flavour: NoteBlockSchema.model.flavour,
    edgeless: true,
    onDragStart: ({ state, startDragging, anchorBlockPath }) => {
      if (!anchorBlockPath) return false;

      const element = captureEventTarget(state.raw.target);
      const insideDragHandle = !!element?.closest(AFFINE_DRAG_HANDLE_WIDGET);
      if (!insideDragHandle) return false;

      const anchorComponent = this.std.view.viewFromPath(
        'block',
        anchorBlockPath
      );
      if (
        !anchorComponent ||
        !matchFlavours(anchorComponent.model, [NoteBlockSchema.model.flavour])
      )
        return false;

      const noteComponent = anchorComponent as NoteBlockComponent;

      const notePortal = noteComponent.closest('.edgeless-block-portal-note');
      assertExists(notePortal);
      const dragPreviewEl = notePortal.cloneNode() as HTMLElement;
      dragPreviewEl.style.transform = '';
      dragPreviewEl.style.left = '0';
      dragPreviewEl.style.top = '0';
      const noteBackground = notePortal.querySelector('.note-background');
      assertExists(noteBackground);
      const noteBackgroundClone = noteBackground.cloneNode();
      dragPreviewEl.appendChild(noteBackgroundClone);
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.overflow = 'hidden';
      dragPreviewEl.appendChild(container);
      render(noteComponent.host.renderModel(noteComponent.model), container);

      startDragging([noteComponent], state, dragPreviewEl);
      return true;
    },
    onDragEnd: ({ draggingElements, dropBlockId, dropType }) => {
      if (
        draggingElements.length !== 1 ||
        !matchFlavours(draggingElements[0].model, [
          NoteBlockSchema.model.flavour,
        ])
      ) {
        return false;
      }
      if (dropType === 'in') return true;

      const noteBlock = draggingElements[0].model as NoteBlockModel;
      const targetBlock = this.page.getBlockById(dropBlockId);
      const parentBlock = this.page.getParent(dropBlockId);
      if (!targetBlock || !parentBlock) return true;

      this.page.moveBlocks(
        noteBlock.children,
        parentBlock,
        targetBlock,
        dropType === 'before'
      );
      this.page.deleteBlock(noteBlock);

      return true;
    },
  };

  override connectedCallback() {
    super.connectedCallback();

    this.keymapController.bind();

    this.disposables.add(
      AffineDragHandleWidget.registerOption(this._dragHandleOption)
    );
  }

  override render() {
    return html`
      <div class="affine-note-block-container">
        <div class="affine-block-children-container">
          ${this.renderModelChildren(this.model)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-note': NoteBlockComponent;
  }
}
