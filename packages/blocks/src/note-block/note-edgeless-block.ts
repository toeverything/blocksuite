import type { NoteBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent, EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { MoreIndicatorIcon } from '@blocksuite/affine-components/icons';
import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  NoteDisplayMode,
  StrokeStyle,
} from '@blocksuite/affine-model';
import { EDGELESS_BLOCK_CHILD_PADDING } from '@blocksuite/affine-shared/consts';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import {
  getClosestBlockComponentByPoint,
  handleNativeRangeAtPoint,
  matchFlavours,
  stopPropagation,
} from '@blocksuite/affine-shared/utils';
import { ShadowlessElement, toGfxBlockComponent } from '@blocksuite/block-std';
import {
  almostEqual,
  Bound,
  clamp,
  Point,
  WithDisposable,
} from '@blocksuite/global/utils';
import { css, html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../root-block/index.js';

import { NoteBlockComponent } from './note-block.js';

export class EdgelessNoteMask extends WithDisposable(ShadowlessElement) {
  protected override firstUpdated() {
    const maskDOM = this.renderRoot!.querySelector('.affine-note-mask');
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (!this.model.edgeless.collapse) {
          const bound = Bound.deserialize(this.model.xywh);
          const scale = this.model.edgeless.scale ?? 1;
          const height = entry.contentRect.height * scale;

          if (!height || almostEqual(bound.h, height)) {
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
    const extra = this.editing ? ACTIVE_NOTE_EXTRA_PADDING : 0;
    return html`
      <div
        class="affine-note-mask"
        style=${styleMap({
          position: 'absolute',
          top: `${-extra}px`,
          left: `${-extra}px`,
          bottom: `${-extra}px`,
          right: `${-extra}px`,
          zIndex: '1',
          pointerEvents: this.display ? 'auto' : 'none',
          borderRadius: `${
            this.model.edgeless.style.borderRadius * this.zoom
          }px`,
        })}
      ></div>
    `;
  }

  @property({ attribute: false })
  accessor display!: boolean;

  @property({ attribute: false })
  accessor editing!: boolean;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor model!: NoteBlockModel;

  @property({ attribute: false })
  accessor zoom!: number;
}

const ACTIVE_NOTE_EXTRA_PADDING = 20;

export class EdgelessNoteBlockComponent extends toGfxBlockComponent(
  NoteBlockComponent
) {
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

    .edgeless-note-container:has(.affine-embed-synced-doc-container.editing)
      > .note-background {
      left: ${-ACTIVE_NOTE_EXTRA_PADDING}px !important;
      top: ${-ACTIVE_NOTE_EXTRA_PADDING}px !important;
      width: calc(100% + ${ACTIVE_NOTE_EXTRA_PADDING * 2}px) !important;
      height: calc(100% + ${ACTIVE_NOTE_EXTRA_PADDING * 2}px) !important;
    }

    .edgeless-note-container:has(.affine-embed-synced-doc-container.editing)
      > edgeless-note-mask {
      display: none;
    }
  `;

  private get _isShowCollapsedContent() {
    return this.model.edgeless.collapse && (this._isResizing || this._isHover);
  }

  get _zoom() {
    return this.gfx.viewport.zoom;
  }

  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }

  private _collapsedContent() {
    if (!this._isShowCollapsedContent) {
      return nothing;
    }

    const { xywh, edgeless } = this.model;
    const { borderSize } = edgeless.style;

    const extraPadding = this._editing ? ACTIVE_NOTE_EXTRA_PADDING : 0;
    const extraBorder = this._editing ? borderSize : 0;
    const bound = Bound.deserialize(xywh);
    const scale = edgeless.scale ?? 1;
    const width = bound.w / scale + extraPadding * 2 + extraBorder;
    const height = bound.h / scale;

    const rect = this._notePageContent?.getBoundingClientRect();
    if (!rect) return nothing;

    const zoom = this.gfx.viewport.zoom;
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
          left: `${-(extraPadding + extraBorder / 2)}px`,
          top: `${height + extraPadding + extraBorder / 2}px`,
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

  private _handleClickAtBackground(e: MouseEvent) {
    e.stopPropagation();
    if (!this._editing) return;

    const rect = this.getBoundingClientRect();
    const offsetY = 16 * this._zoom;
    const offsetX = 2 * this._zoom;
    const x = clamp(e.x, rect.left + offsetX, rect.right - offsetX);
    const y = clamp(e.y, rect.top + offsetY, rect.bottom - offsetY);
    handleNativeRangeAtPoint(x, y);

    if (this.doc.readonly) return;

    this._tryAddParagraph(x, y);
  }

  private _hovered() {
    if (
      this.selection.value.some(
        sel => sel.type === 'surface' && sel.blockId === this.model.id
      )
    ) {
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

    this.selection.clear();
  }

  private _tryAddParagraph(x: number, y: number) {
    const nearest = getClosestBlockComponentByPoint(
      new Point(x, y)
    ) as BlockComponent | null;
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
      const [pId] = this.doc.addSiblingBlocks(
        nearestModel,
        [{ flavour: 'affine:paragraph' }],
        insertPos
      );

      this.updateComplete
        .then(() => {
          this.std.selection.setGroup('note', [
            this.std.selection.create('text', {
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

  override connectedCallback(): void {
    super.connectedCallback();

    const selection = this.rootService.selection;

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

  override firstUpdated() {
    const { _disposables } = this;
    const selection = this.rootService.selection;

    _disposables.add(
      this.rootService.slots.elementResizeStart.on(() => {
        if (selection.selectedElements.includes(this.model)) {
          this._isResizing = true;
        }
      })
    );

    _disposables.add(
      this.rootService.slots.elementResizeEnd.on(() => {
        this._isResizing = false;
      })
    );

    const observer = new MutationObserver(() => {
      const rect = this._notePageContent?.getBoundingClientRect();
      if (!rect) return;
      const zoom = this.gfx.viewport.zoom;
      const scale = this.model.edgeless.scale ?? 1;
      this._noteFullHeight =
        rect.height / scale / zoom + 2 * EDGELESS_BLOCK_CHILD_PADDING;
    });
    if (this._notePageContent) {
      observer.observe(this, { childList: true, subtree: true });
      _disposables.add(() => observer.disconnect());
    }
  }

  override getRenderingRect() {
    const { xywh, edgeless } = this.model;
    const { collapse, scale = 1 } = edgeless;

    const bound = Bound.deserialize(xywh);
    const width = bound.w / scale;
    const height = bound.h / scale;

    return {
      x: bound.x,
      y: bound.y,
      w: width,
      h: collapse ? height : 'inherit',
      zIndex: this.toZIndex(),
    };
  }

  override renderGfxBlock() {
    const { model } = this;
    const { displayMode } = model;
    if (!!displayMode && displayMode === NoteDisplayMode.DocOnly)
      return nothing;

    const { xywh, edgeless } = model;
    const { borderRadius, borderSize, borderStyle, shadowType } =
      edgeless.style;
    const { collapse, collapsedHeight, scale = 1 } = edgeless;

    const bound = Bound.deserialize(xywh);
    const width = bound.w / scale;
    const height = bound.h / scale;

    const style = {
      height: '100%',
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      boxSizing: 'border-box',
      borderRadius: borderRadius + 'px',
      pointerEvents: 'all',
      transformOrigin: '0 0',
      transform: `scale(${scale})`,
      fontWeight: '400',
      lineHeight: 'var(--affine-line-height)',
    };

    const extra = this._editing ? ACTIVE_NOTE_EXTRA_PADDING : 0;
    const backgroundColor = ThemeObserver.generateColorProperty(
      model.background,
      DEFAULT_NOTE_BACKGROUND_COLOR
    );

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
      backgroundColor,
      border: `${borderSize}px ${
        borderStyle === StrokeStyle.Dash ? 'dashed' : borderStyle
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
        class="edgeless-note-container"
        style=${styleMap(style)}
        data-model-height="${bound.h}"
        @mouseleave=${this._leaved}
        @mousemove=${this._hovered}
        data-scale="${scale}"
      >
        <div
          class="note-background"
          style=${styleMap(backgroundStyle)}
          @pointerdown=${stopPropagation}
          @click=${this._handleClickAtBackground}
        ></div>

        <div
          class="edgeless-note-page-content"
          style=${styleMap({
            width: '100%',
            height: '100%',
            'overflow-y': this._isShowCollapsedContent ? 'initial' : 'clip',
          })}
        >
          ${this.renderPageContent()}
        </div>

        ${isCollapsable
          ? html`<div
              class="${classMap({
                'edgeless-note-collapse-button': true,
                flip: isCollapseArrowUp,
                hide: this._isSelected,
              })}"
              style=${styleMap({
                bottom: this._editing ? `${-extra}px` : '0',
              })}
              @mousedown=${stopPropagation}
              @mouseup=${stopPropagation}
              @click=${this._setCollapse}
            >
              ${MoreIndicatorIcon}
            </div>`
          : nothing}
        ${this._collapsedContent()}

        <edgeless-note-mask
          .model=${this.model}
          .display=${!this._editing}
          .host=${this.host}
          .zoom=${this.gfx.viewport.zoom ?? 1}
          .editing=${this._editing}
        ></edgeless-note-mask>
      </div>
    `;
  }

  @state()
  private accessor _editing = false;

  @state()
  private accessor _isHover = false;

  @state()
  private accessor _isResizing = false;

  @state()
  private accessor _isSelected = false;

  @state()
  private accessor _noteFullHeight = 0;

  @query('.edgeless-note-page-content .affine-note-block-container')
  private accessor _notePageContent: HTMLElement | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-note': EdgelessNoteBlockComponent;
  }
}
