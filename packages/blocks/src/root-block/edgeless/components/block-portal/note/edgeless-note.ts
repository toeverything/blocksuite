import '../../note-slicer/index.js';

import type { BlockElement } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EDGELESS_BLOCK_CHILD_PADDING } from '../../../../../_common/consts.js';
import { DEFAULT_NOTE_COLOR } from '../../../../../_common/edgeless/note/consts.js';
import { MoreIndicatorIcon } from '../../../../../_common/icons/edgeless.js';
import { NoteDisplayMode } from '../../../../../_common/types.js';
import { almostEqual, clamp } from '../../../../../_common/utils/math.js';
import { matchFlavours } from '../../../../../_common/utils/model.js';
import { getClosestBlockElementByPoint } from '../../../../../_common/utils/query.js';
import { Point } from '../../../../../_common/utils/rect.js';
import { handleNativeRangeAtPoint } from '../../../../../_common/utils/selection.js';
import { type NoteBlockModel } from '../../../../../note-block/note-model.js';
import { Bound, StrokeStyle } from '../../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';
import type { EdgelessBlockModel } from '../../../type.js';
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

  @property({ attribute: false })
  display!: boolean;

  get edgeless() {
    return this.surface.edgeless;
  }

  protected override firstUpdated() {
    const maskDOM = this.renderRoot!.querySelector('.affine-note-mask');
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (!this.model.edgeless.collapse) {
          const bound = Bound.deserialize(this.model.xywh);
          const scale = this.model.edgeless.scale ?? 1;
          const height = entry.contentRect.height * scale;
          if (almostEqual(bound.h, height)) {
            return;
          }

          bound.h = height;
          this.model.stash('xywh');
          this.model.xywh = bound.serialize();
        }
      }
    });

    observer.observe(maskDOM!);

    this._disposables.add(() => {
      // check if model still exist
      if (this.model.doc.getBlockById(this.model.id)) {
        this.model.pop('xywh');
      }
      observer.disconnect();
    });
  }

  override render() {
    return html`
      <div
        class="affine-note-mask"
        style=${styleMap({
          position: 'absolute',
          top: '0',
          left: '0',
          bottom: '0',
          right: '0',
          zIndex: '1',
          pointerEvents: this.display ? 'auto' : 'none',
          borderRadius: `${
            this.model.edgeless.style.borderRadius *
            this.edgeless.service.viewport.zoom
          }px`,
        })}
      ></div>
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

    .edgeless-block-portal-note:has(.affine-embed-synced-doc-container.editing)
      > .note-background {
      left: ${-ACTIVE_NOTE_EXTRA_PADDING}px !important;
      top: ${-ACTIVE_NOTE_EXTRA_PADDING}px !important;
      width: calc(100% + ${ACTIVE_NOTE_EXTRA_PADDING * 2}px) !important;
      height: calc(100% + ${ACTIVE_NOTE_EXTRA_PADDING * 2}px) !important;
    }

    .edgeless-block-portal-note:has(.affine-embed-synced-doc-container.editing)
      > edgeless-note-mask {
      display: none;
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

  get _zoom() {
    return this.edgeless.service.viewport.zoom;
  }

  private get _isShowCollapsedContent() {
    return this.model.edgeless.collapse && (this._isResizing || this._isHover);
  }

  private _hovered() {
    if (!this._isHover && this.edgeless.service.selection.has(this.model.id)) {
      this._isHover = true;
    }
  }

  private _leaved() {
    if (this._isHover) {
      this._isHover = false;
    }
  }

  private _handleClickAtBackground(e: MouseEvent) {
    e.stopPropagation();
    if (!this._affineNote || !this._editing) return;

    const rect = this._affineNote.getBoundingClientRect();
    const offsetY = 16 * this._zoom;
    const offsetX = 2 * this._zoom;
    const x = clamp(e.x, rect.left + offsetX, rect.right - offsetX);
    const y = clamp(e.y, rect.top + offsetY, rect.bottom - offsetY);
    handleNativeRangeAtPoint(x, y);

    if (this.surface.doc.readonly) return;
    this._tryAddParagraph(x, y);
  }

  private _tryAddParagraph(x: number, y: number) {
    const nearest = getClosestBlockElementByPoint(
      new Point(x, y)
    ) as BlockElement | null;
    if (!nearest) return;

    const nearestBBox = nearest.getBoundingClientRect();
    const yRel = y - nearestBBox.top;

    const insertPos: 'before' | 'after' =
      yRel < nearestBBox.height / 2 ? 'before' : 'after';

    const nearestModel = nearest.model as BlockModel;
    const nearestModelIdx = this.model.children.indexOf(nearestModel);

    const children = this.model.children;
    const siblingModel =
      children[
        clamp(
          nearestModelIdx + (insertPos === 'before' ? -1 : 1),
          0,
          children.length
        )
      ];

    if (
      (!nearestModel.text ||
        !matchFlavours(nearestModel, ['affine:paragraph', 'affine:list'])) &&
      (!siblingModel ||
        !siblingModel.text ||
        !matchFlavours(siblingModel, ['affine:paragraph', 'affine:list']))
    ) {
      const [pId] = this.surface.doc.addSiblingBlocks(
        nearestModel,
        [{ flavour: 'affine:paragraph' }],
        insertPos
      );

      this.updateComplete
        .then(() => {
          this.surface.selection.setGroup('note', [
            this.surface.selection.create('text', {
              from: {
                blockId: pId,
                index: 0,
                length: 0,
              },
              to: null,
            }),
          ]);
        })
        .catch(console.error);
    }
  }

  private _setCollapse(event: MouseEvent) {
    event.stopImmediatePropagation();

    const { collapse, collapsedHeight } = this.model.edgeless;

    if (collapse) {
      this.model.doc.updateBlock(this.model, () => {
        this.model.edgeless.collapse = false;
      });
    } else if (collapsedHeight) {
      const { xywh, edgeless } = this.model;
      const bound = Bound.deserialize(xywh);
      bound.h = collapsedHeight * (edgeless.scale ?? 1);
      this.model.doc.updateBlock(this.model, () => {
        this.model.edgeless.collapse = true;
        this.model.xywh = bound.serialize();
      });
    }

    this.edgeless.service.selection.clear();
  }

  private _collapsedContent() {
    if (!this._isShowCollapsedContent || !this._affineNote) {
      return nothing;
    }

    const { xywh, edgeless } = this.model;

    const bound = Bound.deserialize(xywh);
    const scale = edgeless.scale ?? 1;
    const width = bound.w / scale;
    const height = bound.h / scale;

    const rect = this._affineNote.getBoundingClientRect();
    const zoom = this.edgeless.service.viewport.zoom;
    this._noteFullHeight =
      rect.height / scale / zoom + 2 * EDGELESS_BLOCK_CHILD_PADDING;

    if (height >= this._noteFullHeight) {
      return nothing;
    }

    return html`
      <div
        style=${styleMap({
          width: `${width}px`,
          height: `${this._noteFullHeight - height}px`,
          position: 'absolute',
          left: '0px',
          top: `${height}px`,
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
    const selection = this.edgeless.service.selection;

    _disposables.add(
      edgeless.slots.elementResizeStart.on(() => {
        if (selection.elements.includes(this.model as EdgelessBlockModel)) {
          this._isResizing = true;
        }
      })
    );

    _disposables.add(
      edgeless.slots.elementResizeEnd.on(() => {
        this._isResizing = false;
      })
    );

    const observer = new MutationObserver(() => {
      const affineNote = this._affineNote;
      if (!this._affineNote) return;
      const rect = affineNote.getBoundingClientRect();
      const zoom = this.edgeless.service.viewport.zoom;
      const scale = this.model.edgeless.scale ?? 1;
      this._noteFullHeight =
        rect.height / scale / zoom + 2 * EDGELESS_BLOCK_CHILD_PADDING;
    });
    observer.observe(this, { childList: true, subtree: true });
    _disposables.add(() => observer.disconnect());
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const selection = this.edgeless.service.selection;

    this._editing = selection.has(this.model.id) && selection.editing;
    this._disposables.add(
      selection.slots.updated.on(() => {
        if (selection.has(this.model.id) && selection.editing) {
          this._editing = true;
        } else {
          this._editing = false;
        }
      })
    );
  }

  override render() {
    const { model, surface, index } = this;
    const { displayMode } = model;
    if (!!displayMode && displayMode === NoteDisplayMode.DocOnly)
      return nothing;

    const { xywh, background, edgeless } = model;
    const { borderRadius, borderSize, borderStyle, shadowType } =
      edgeless.style;
    const { collapse, collapsedHeight, scale = 1 } = edgeless;

    const bound = Bound.deserialize(xywh);
    const width = bound.w / scale;
    const height = bound.h / scale;

    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${width}px`,
      height: collapse ? `${height}px` : 'inherit',
      left: `${bound.x}px`,
      top: `${bound.y}px`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      boxSizing: 'border-box',
      borderRadius: borderRadius + 'px',
      pointerEvents: 'all',
      transformOrigin: '0 0',
      transform: `scale(${scale})`,
    };

    const extra = this._editing ? ACTIVE_NOTE_EXTRA_PADDING : 0;

    const backgroundStyle = {
      position: 'absolute',
      left: `${-extra}px`,
      top: `${-extra}px`,
      width: `${width + extra * 2}px`,
      height: `calc(100% + ${extra * 2}px)`,
      borderRadius: borderRadius + 'px',
      transition: this._editing
        ? 'left 0.3s, top 0.3s, width 0.3s, height 0.3s'
        : 'none',
      background: `var(${background ?? DEFAULT_NOTE_COLOR})`,
      border: `${borderSize}px ${
        borderStyle === StrokeStyle.Dashed ? 'dashed' : borderStyle
      } var(--affine-black-10)`,
      boxShadow: this._editing
        ? 'var(--affine-active-shadow)'
        : !shadowType
          ? 'none'
          : `var(${shadowType})`,
    };

    const isCollapsable =
      collapse != null &&
      collapsedHeight != null &&
      collapsedHeight !== this._noteFullHeight;

    const isCollapseArrowUp = collapse
      ? this._noteFullHeight < height
      : !!collapsedHeight && collapsedHeight < height;

    return html`
      <div
        class="edgeless-block-portal-note blocksuite-overlay"
        style=${styleMap(style)}
        data-model-height="${bound.h}"
        @mouseleave=${this._leaved}
        @mousemove=${this._hovered}
        data-scale="${scale}"
      >
        <div
          class="note-background"
          style=${styleMap(backgroundStyle)}
          @pointerdown=${(e: MouseEvent) => e.stopPropagation()}
          @click=${this._handleClickAtBackground}
        ></div>

        <div
          style=${styleMap({
            width: '100%',
            height: '100%',
            'overflow-y': this._isShowCollapsedContent ? 'initial' : 'clip',
          })}
        >
          ${surface.host.renderModel(model)}
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
          .display=${!this._editing}
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
