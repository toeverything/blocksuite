import '../../note-slicer/index.js';

import { sleep } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ACTIVE_NOTE_EXTRA_PADDING,
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
  @state()
  private _editing = false;

  @state()
  private _transition = 'none';

  private _handleEditingTransition() {
    const selection = this.surface.edgeless.selectionManager;
    this._disposables.add(
      selection.slots.updated.on(async () => {
        if (
          selection.state.editing &&
          selection.state.elements.includes(this.model.id)
        ) {
          this._editing = true;
          this._transition = 'left 0.3s, top 0.3s, width 0.3s, height 0.3s';
        } else {
          this._editing = false;
          if (this._transition !== 'none') {
            // wait for animation done
            await sleep(300);
            this._transition = 'none';
          }
        }
      })
    );
  }

  override firstUpdated() {
    this._handleEditingTransition();
  }

  override render() {
    const { model, surface, index } = this;
    const { xywh, background } = model;
    const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
    const isHiddenNote = model.hidden;
    const { zoom } = surface.viewport;

    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${modelW}px`,
      transform: `translate(${modelX * zoom}px, ${
        modelY * zoom
      }px) scale(${zoom})`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      boxSizing: 'border-box',
      borderRadius: '8px',
      pointerEvents: 'all',
      transformOrigin: '0 0',
    };

    const extra = this._editing ? ACTIVE_NOTE_EXTRA_PADDING : 0;
    const backgroundStyle = {
      position: 'absolute',
      left: `${-extra}px`,
      top: `${-extra}px`,
      width: `${modelW + extra * 2}px`,
      height: `calc(100% + ${extra * 2}px)`,
      borderRadius: '8px',
      transition: this._transition,
      background: isHiddenNote
        ? 'transparent'
        : `var(${background ?? DEFAULT_NOTE_COLOR})`,
      border: this._editing
        ? `1px solid var(--affine-blue-600)`
        : isHiddenNote
        ? `2px dashed var(--affine-black-10)`
        : 'none',
      boxShadow: this._editing
        ? 'var(--affine-active-shadow)'
        : isHiddenNote
        ? 'none'
        : 'var(--affine-note-shadow-box)',
    };

    return html`
      <div
        class="edgeless-block-portal-note"
        style=${styleMap(style)}
        data-model-height="${modelH}"
      >
        <div class="note-background" style=${styleMap(backgroundStyle)}></div>
        ${this.renderModel(model)}
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
