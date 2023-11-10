import '../../note-slicer/index.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../../../../_common/consts.js';
import {
  DEFAULT_NOTE_COLOR,
  type NoteBlockModel,
} from '../../../../../note-block/note-model.js';
import { deserializeXYWH } from '../../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

@customElement('edgeless-note-mask')
export class EdgelessNoteMask extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  model!: NoteBlockModel;

  get edgeless() {
    return this.surface.edgeless;
  }

  protected override firstUpdated() {
    this._disposables.add(
      this.edgeless.selectionManager.slots.updated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    if (
      this.edgeless.selectionManager.state.editing &&
      this.edgeless.selectionManager.state.elements.includes(this.model.id)
    ) {
      return nothing;
    }

    const style = {
      position: 'absolute',
      top: '0',
      left: '0',
      bottom: '0',
      right: '0',
      zIndex: '1',
      pointerEvents: 'auto',
    };
    return html`
      <div class="affine-note-mask" style=${styleMap(style)}></div>
    `;
  }
}

@customElement('edgeless-block-portal-note')
export class EdgelessBlockPortalNote extends EdgelessPortalBase<NoteBlockModel> {
  override render() {
    const { model, surface, index } = this;
    const { xywh, background } = model;
    const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
    const isHiddenNote = model.hidden;
    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: modelW + 'px',
      transform: `translate(${modelX}px, ${modelY}px)`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      border: `${EDGELESS_BLOCK_CHILD_BORDER_WIDTH}px ${
        isHiddenNote ? 'dashed' : 'solid'
      } var(--affine-black-10)`,
      borderRadius: '8px',
      boxSizing: 'border-box',
      background: isHiddenNote
        ? 'transparent'
        : `var(${background ?? DEFAULT_NOTE_COLOR})`,
      boxShadow: isHiddenNote ? undefined : 'var(--affine-shadow-3)',
      pointerEvents: 'all',
      overflow: 'hidden',
      transformOrigin: '0 0',
    };

    return html`
      <div
        class="edgeless-block-portal-note"
        style=${styleMap(style)}
        data-model-height="${modelH}"
      >
        ${surface.edgeless.renderModel(model)}
        <edgeless-note-mask
          .surface=${surface}
          .model=${this.model}
        ></edgeless-note-mask>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-note': EdgelessBlockPortalNote;
    'edgeless-note-mask': EdgelessNoteMask;
  }
}
