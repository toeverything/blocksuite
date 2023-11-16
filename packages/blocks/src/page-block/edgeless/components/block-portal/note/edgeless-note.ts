import '../../note-slicer/index.js';

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
import { Bound, StrokeStyle } from '../../../../../surface-block/index.js';
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

  private _handleEditingTransition() {
    const selection = this.surface.edgeless.selectionManager;
    this._disposables.add(
      selection.slots.updated.on(async () => {
        if (this._isEditing) {
          this._editing = true;
        } else {
          this._editing = false;
        }
      })
    );
  }

  private get _isEditing() {
    const selection = this.surface.edgeless.selectionManager;
    return (
      selection.state.editing &&
      selection.state.elements.includes(this.model.id)
    );
  }

  override firstUpdated() {
    this._handleEditingTransition();
  }

  override render() {
    const { model, surface, index } = this;
    const {
      xywh,
      background,
      borderRadius,
      borderSize,
      borderStyle,
      hidden,
      shadowStyle,
      autoHeight,
    } = model;
    const bound = Bound.deserialize(xywh);

    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: autoHeight ? 'inherit' : `${bound.h}px`,
      transform: `translate(${bound.x}px, ${bound.y}px)`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      boxSizing: 'border-box',
      borderRadius: borderRadius + 'px',
      pointerEvents: 'all',
      transformOrigin: '0 0',
    };

    const editing = this._isEditing;
    if (!this._editing) {
      this._editing = editing;
    }
    const extra = this._editing ? ACTIVE_NOTE_EXTRA_PADDING : 0;

    const backgroundStyle = {
      position: 'absolute',
      left: `${-extra}px`,
      top: `${-extra}px`,
      width: `${bound.w + extra * 2}px`,
      height: `calc(100% + ${extra * 2}px)`,
      borderRadius: borderRadius + 'px',
      transition: this._editing
        ? 'left 0.3s, top 0.3s, width 0.3s, height 0.3s'
        : 'none',
      background: hidden
        ? 'transparent'
        : `var(${background ?? DEFAULT_NOTE_COLOR})`,
      border: hidden
        ? `2px dashed var(--affine-black-10)`
        : `${borderSize}px ${
            borderStyle === StrokeStyle.Dashed ? 'dashed' : borderStyle
          } var(--affine-black-10)`,
      boxShadow: hidden ? 'none' : `var(${shadowStyle})`,
    };

    return html`
      <div
        class="edgeless-block-portal-note"
        style=${styleMap(style)}
        data-model-height="${bound.h}"
      >
        <div class="note-background" style=${styleMap(backgroundStyle)}></div>
        <div
          style=${styleMap({
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          })}
        >
          ${surface.edgeless.renderModel(model)}
        </div>
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
