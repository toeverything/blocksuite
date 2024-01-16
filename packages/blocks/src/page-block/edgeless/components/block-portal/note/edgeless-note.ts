import '../../note-slicer/index.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EDGELESS_BLOCK_CHILD_PADDING } from '../../../../../_common/consts.js';
import { DEFAULT_NOTE_COLOR } from '../../../../../_common/edgeless/note/consts.js';
import { MoreIndicatorIcon } from '../../../../../_common/icons/edgeless.js';
import { NoteDisplayMode } from '../../../../../_common/types.js';
import { almostEqual } from '../../../../../_common/utils/math.js';
import { type NoteBlockModel } from '../../../../../note-block/note-model.js';
import { Bound, StrokeStyle } from '../../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';
import {
  deserializeXYWH,
  serializeXYWH,
} from '../../../../../surface-block/utils/xywh.js';
import { EdgelessPortalBase } from '../edgeless-portal-base.js';

const ACTIVE_NOTE_EXTRA_PADDING = 20;

@customElement('edgeless-note-mask')
export class EdgelessNoteMask extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-note-mask:hover {
      background-color: var(--affine-hover-color);
    }
  `;

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

    const maskDOM = this.renderRoot!.querySelector('.affine-note-mask');
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (!this.model.edgeless.collapse) {
          const [x, y, w, h] = deserializeXYWH(this.model.xywh);

          if (almostEqual(h, entry.contentRect.height)) return;

          this.model.stash('xywh');
          this.model.xywh = serializeXYWH(x, y, w, entry.contentRect.height);
        }
      }
    });

    observer.observe(maskDOM!);

    this._disposables.add(() => {
      // check if model still exist
      if (this.model.page.getBlockById(this.model.id)) {
        this.model.pop('xywh');
      }
      observer.disconnect();
    });
  }

  override render() {
    const selected =
      this.edgeless?.selectionManager.has(this.model.id) &&
      this.edgeless?.selectionManager.selections.some(
        sel => sel.elements.includes(this.model.id) && sel.editing
      );

    const style = {
      position: 'absolute',
      top: '0',
      left: '0',
      bottom: '0',
      right: '0',
      zIndex: '1',
      pointerEvents: selected ? 'none' : 'auto',
      borderRadius: `${
        this.model.edgeless.style.borderRadius * this.surface.viewport.zoom
      }px`,
    };

    return html`
      <div class="affine-note-mask" style=${styleMap(style)}></div>
    `;
  }
}

@customElement('edgeless-block-portal-note')
export class EdgelessBlockPortalNote extends EdgelessPortalBase<NoteBlockModel> {
  static override styles = css`
    .edgeless-note-collapse-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      z-index: 2;
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0.2;
      transition: opacity 0.3s;
    }
    .edgeless-note-collapse-button:hover {
      opacity: 1;
    }
    .edgeless-note-collapse-button.flip {
      transform: translateX(-50%) rotate(180deg);
    }
    .edgeless-note-collapse-button.hide {
      display: none;
    }

    .edgeless-block-portal-note:has(.edgeless-note-collapse-button:hover) {
      .affine-note-mask {
        background-color: var(--affine-hover-color);
      }
    }
  `;

  @state()
  private _isSelected = false;

  @state()
  private _editing = false;

  @state()
  private _isResizing = false;

  @state()
  private _isHover = false;

  @state()
  private _noteFullHeight = 0;

  @query('affine-note')
  private _affineNote!: HTMLDivElement;

  private _handleEditingTransition() {
    const selection = this.surface.edgeless.selectionManager;
    this._disposables.add(
      selection.slots.updated.on(selections => {
        if (selection.has(this.model.id) && selections?.[0].editing) {
          this._editing = true;
        } else {
          this._editing = false;
        }
      })
    );
  }

  private get _isShowCollapsedContent() {
    return this.model.edgeless.collapse && (this._isResizing || this._isHover);
  }

  private _hovered() {
    if (!this._isHover && this.edgeless.selectionManager.has(this.model.id)) {
      this._isHover = true;
    }
  }

  private _leaved() {
    if (this._isHover) {
      this._isHover = false;
    }
  }

  private _setCollapse(event: MouseEvent) {
    event.stopImmediatePropagation();
    const { xywh } = this.model;
    const { collapse, collapsedHeight } = this.model.edgeless;

    const bound = Bound.deserialize(xywh);
    if (collapse) {
      this.model.page.updateBlock(this.model, () => {
        this.model.edgeless.collapsedHeight = bound.h;
        this.model.edgeless.collapse = false;
      });
    } else if (collapsedHeight) {
      bound.h = collapsedHeight;
      this.model.page.updateBlock(this.model, () => {
        this.model.edgeless.collapse = true;
        this.model.xywh = bound.serialize();
      });
    }

    this.edgeless.selectionManager.clear();
  }

  private _collapsedContent() {
    if (!this._isShowCollapsedContent || !this._affineNote) {
      return nothing;
    }

    const { model, surface } = this;
    const bound = Bound.deserialize(model.xywh);
    if (bound.h >= this._noteFullHeight) {
      return nothing;
    }

    const zoom = surface.viewport.zoom;

    return html`
      <div
        style=${styleMap({
          width: `${bound.w}px`,
          height: `${
            this._noteFullHeight - EDGELESS_BLOCK_CHILD_PADDING / zoom - bound.h
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

  override firstUpdated() {
    const { _disposables, edgeless } = this;
    const selection = this.surface.edgeless.selectionManager;

    this._handleEditingTransition();

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
      edgeless.selectionManager.slots.updated.on(() => {
        this._isSelected = edgeless.selectionManager.elements.includes(
          this.model
        );

        this._isHover =
          this._isSelected &&
          edgeless.tools.getHoverState()?.content === this.model;
      })
    );

    const observer = new MutationObserver(() => {
      const affineNote = this._affineNote;
      if (!this._affineNote) return;
      const rect = affineNote.getBoundingClientRect();
      const zoom = this.surface.viewport.zoom;
      this._noteFullHeight =
        (rect.height + 2 * EDGELESS_BLOCK_CHILD_PADDING) / zoom;
    });
    observer.observe(this, { childList: true, subtree: true });
    _disposables.add(() => observer.disconnect());
  }

  override render() {
    const { model, surface, index } = this;
    const { displayMode } = model;
    if (displayMode === NoteDisplayMode.PageOnly) return nothing;

    const { xywh, background, hidden, edgeless } = model;
    const { borderRadius, borderSize, borderStyle, shadowType } =
      edgeless.style;
    const { collapse, collapsedHeight } = edgeless;
    const bound = Bound.deserialize(xywh);

    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${bound.w}px`,
      height: collapse ? `${bound.h}px` : 'inherit',
      left: `${bound.x}px`,
      top: `${bound.y}px`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      boxSizing: 'border-box',
      borderRadius: borderRadius + 'px',
      pointerEvents: 'all',
      transformOrigin: '0 0',
    };

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
      boxShadow: this._editing
        ? 'var(--affine-active-shadow)'
        : hidden || !shadowType
          ? 'none'
          : `var(${shadowType})`,
    };

    const isCollapsable =
      collapse != null &&
      collapsedHeight != null &&
      collapsedHeight !== this._noteFullHeight;

    const isCollapseArrowUp = collapse
      ? this._noteFullHeight < bound.h
      : !!collapsedHeight && this._noteFullHeight > collapsedHeight;

    return html`
      <div
        class="edgeless-block-portal-note blocksuite-overlay"
        style=${styleMap(style)}
        data-model-height="${bound.h}"
        @mouseleave=${this._leaved}
        @mousemove=${this._hovered}
      >
        <div class="note-background" style=${styleMap(backgroundStyle)}></div>

        <div
          style=${styleMap({
            width: '100%',
            height: '100%',
            padding: '0 4px',
            overflow: this._isShowCollapsedContent ? 'initial' : 'hidden',
          })}
        >
          ${surface.edgeless.renderModel(model)}
        </div>

        ${isCollapsable
          ? html`<div
              class="${classMap({
                'edgeless-note-collapse-button': true,
                flip: isCollapseArrowUp,
                hide: this._isSelected,
              })}"
              @mousedown=${(e: MouseEvent) => e.stopPropagation()}
              @mouseup=${(e: MouseEvent) => e.stopPropagation()}
              @click=${this._setCollapse}
            >
              ${MoreIndicatorIcon}
            </div>`
          : nothing}
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
