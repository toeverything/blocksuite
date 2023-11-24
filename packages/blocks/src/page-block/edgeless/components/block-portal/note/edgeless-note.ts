import '../../note-slicer/index.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ACTIVE_NOTE_EXTRA_PADDING,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../../../../_common/consts.js';
import { DEFAULT_NOTE_COLOR } from '../../../../../_common/edgeless/note/consts.js';
import { type NoteBlockModel } from '../../../../../note-block/note-model.js';
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

  @state()
  private _isResizing = false;

  @state()
  private _isHover = false;

  @query('affine-note')
  private _affineNote!: HTMLDivElement;

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
    const { _disposables, edgeless } = this;
    const selection = this.surface.edgeless.selectionManager;

    this._handleEditingTransition();

    this.model.propsUpdated.on(() => {
      this.requestUpdate();
    });

    _disposables.add(
      edgeless.slots.elementResizeStart.on(() => {
        if (selection.elements.includes(this.model)) {
          this._isResizing = true;
        }
      })
    );

    _disposables.add(
      edgeless.slots.elementResizeEnd.on(() => {
        this._isResizing = false;
      })
    );

    _disposables.add(
      edgeless.slots.hoverUpdated.on(() => {
        this._isHover =
          edgeless.tools.getHoverState()?.content === this.model &&
          edgeless.selectionManager.elements.includes(this.model);
      })
    );

    _disposables.add(
      edgeless.selectionManager.slots.updated.on(() => {
        if (edgeless.selectionManager.elements.includes(this.model)) {
          this._isHover =
            edgeless.tools.getHoverState()?.content === this.model;
        }
      })
    );
  }

  private get _isShowCollapsedContent() {
    const edgeless = this.model.edgeless;
    const collapse = edgeless ? edgeless.collapse : false;
    return (
      collapse &&
      (this._isResizing || this._isHover) &&
      this.edgeless.selectionManager.elements.includes(this.model)
    );
  }

  private _collapsedContent() {
    const { model, surface } = this;
    if (!this._isShowCollapsedContent || !this._affineNote) return nothing;

    const rect = this._affineNote.getBoundingClientRect();
    const bound = Bound.deserialize(model.xywh);
    const zoom = surface.viewport.zoom;

    if (bound.h >= (rect.height + EDGELESS_BLOCK_CHILD_PADDING) / zoom)
      return nothing;

    return html`
      <div
        style=${styleMap({
          width: `${bound.w}px`,
          height: `${
            (rect.height + EDGELESS_BLOCK_CHILD_PADDING) / zoom - bound.h
          }px`,
          position: 'absolute',
          left: '0px',
          top: `${bound.h}px`,
          background: 'var(--affine-white)',
          opacity: 0.5,
          pointerEvents: 'none',
          borderLeft: '2px var(--affine-blue) solid',
          borderBottom: '2px var(--affine-blue) solid',
          borderRight: '2px var(--affine-blue) solid',
          borderRadius: '0 0 8px 8px',
        })}
      ></div>
    `;
  }

  override render() {
    const { model, surface, index } = this;
    const { xywh, background, hidden, edgeless } = model;
    const borderRadius = edgeless ? edgeless.style.borderRadius : 8;
    const borderSize = edgeless ? edgeless.style.borderSize : 4;
    const borderStyle = edgeless ? edgeless.style.borderStyle : 'solid';
    const shadowType = edgeless ? edgeless.style.shadowType : 'none';
    const collapse = edgeless ? edgeless.collapse : false;

    const bound = Bound.deserialize(xywh);

    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: collapse ? `${bound.h}px` : 'inherit',
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
      boxShadow: editing
        ? 'var(--affine-active-shadow)'
        : hidden || !shadowType
          ? 'none'
          : `var(${shadowType})`,
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
            overflow: this._isShowCollapsedContent ? 'initial' : 'hidden',
          })}
        >
          ${surface.edgeless.renderModel(model)}
        </div>
        ${this._collapsedContent()}
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
