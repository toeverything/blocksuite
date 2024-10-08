import type { EdgelessTextBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';

import { TextUtils } from '@blocksuite/affine-block-surface';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { GfxBlockComponent } from '@blocksuite/block-std';
import { Bound } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import type {
  EdgelessRootBlockComponent,
  EdgelessRootService,
} from '../root-block/index.js';

import { HandleDirection } from '../root-block/edgeless/components/resize/resize-handles.js';
import {
  DefaultModeDragType,
  DefaultToolController,
} from '../root-block/edgeless/tools/default-tool.js';

export const EDGELESS_TEXT_BLOCK_MIN_WIDTH = 50;
export const EDGELESS_TEXT_BLOCK_MIN_HEIGHT = 50;

export class EdgelessTextBlockComponent extends GfxBlockComponent<EdgelessTextBlockModel> {
  static override styles = css`
    .edgeless-text-block-container[data-max-width='false'] .inline-editor span {
      word-break: normal !important;
      overflow-wrap: normal !important;
    }
  `;

  private _horizontalResizing = false;

  private _resizeObserver = new ResizeObserver(() => {
    if (this.doc.readonly) {
      return;
    }

    if (!this._editing) {
      return;
    }

    if (!this.model.hasMaxWidth) {
      this._updateW();
    }

    this._updateH();
  });

  get dragMoving() {
    const controller = this.rootService.tool.currentController;
    return (
      controller instanceof DefaultToolController &&
      controller.dragType === DefaultModeDragType.ContentMoving
    );
  }

  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }

  private _initDragEffect() {
    const disposables = this.disposables;
    const edgelessSelection = this.rootService.selection;
    const rootComponent = this
      .rootComponent as EdgelessRootBlockComponent | null;

    if (!rootComponent || !edgelessSelection) return;

    const selectedRect = rootComponent.selectedRect;
    if (!selectedRect) return;

    disposables.add(
      selectedRect.slots.dragStart
        .filter(() => edgelessSelection.selectedElements.includes(this.model))
        .on(() => {
          if (
            selectedRect.dragDirection === HandleDirection.Left ||
            selectedRect.dragDirection === HandleDirection.Right
          ) {
            this._horizontalResizing = true;
          }
        })
    );
    disposables.add(
      selectedRect.slots.dragMove
        .filter(() => edgelessSelection.selectedElements.includes(this.model))
        .on(() => {
          if (
            selectedRect.dragDirection === HandleDirection.Left ||
            selectedRect.dragDirection === HandleDirection.Right
          ) {
            this._updateH();
          }
        })
    );
    disposables.add(
      selectedRect.slots.dragEnd
        .filter(() => edgelessSelection.selectedElements.includes(this.model))
        .on(() => {
          if (
            selectedRect.dragDirection === HandleDirection.Left ||
            selectedRect.dragDirection === HandleDirection.Right
          ) {
            this._horizontalResizing = false;
          }
        })
    );
  }

  private _updateH() {
    const bound = Bound.deserialize(this.model.xywh);
    const rect = this._textContainer.getBoundingClientRect();
    bound.h = Math.max(
      rect.height / this.gfx.viewport.zoom,
      EDGELESS_TEXT_BLOCK_MIN_HEIGHT * this.gfx.viewport.zoom
    );

    this.doc.updateBlock(this.model, {
      xywh: bound.serialize(),
    });
  }

  private _updateW() {
    const bound = Bound.deserialize(this.model.xywh);
    const rect = this._textContainer.getBoundingClientRect();
    bound.w = Math.max(
      rect.width / this.gfx.viewport.zoom,
      EDGELESS_TEXT_BLOCK_MIN_WIDTH * this.gfx.viewport.zoom
    );

    this.doc.updateBlock(this.model, {
      xywh: bound.serialize(),
    });
  }

  checkWidthOverflow(width: number) {
    let wValid = true;

    const oldWidthStr = this._textContainer.style.width;
    this._textContainer.style.width = `${width}px`;
    if (
      this.childrenContainer.scrollWidth > this.childrenContainer.offsetWidth
    ) {
      wValid = false;
    }
    this._textContainer.style.width = oldWidthStr;

    return wValid;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        this.updateComplete
          .then(() => {
            const command = this.host.command;
            const blockSelections = this.model.children.map(child =>
              this.host.selection.create('block', {
                blockId: child.id,
              })
            );

            if (key === 'fontStyle') {
              command.exec('formatBlock', {
                blockSelections,
                styles: {
                  italic: null,
                },
              });
            } else if (key === 'color') {
              command.exec('formatBlock', {
                blockSelections,
                styles: {
                  color: null,
                },
              });
            } else if (key === 'fontWeight') {
              command.exec('formatBlock', {
                blockSelections,
                styles: {
                  bold: null,
                },
              });
            }
          })
          .catch(console.error);
      })
    );

    this.style.transformOrigin = '0 0';
  }

  override firstUpdated(props: Map<string, unknown>) {
    super.firstUpdated(props);

    const { disposables, rootService } = this;
    const edgelessSelection = rootService.selection;

    this._initDragEffect();

    disposables.add(
      edgelessSelection.slots.updated.on(() => {
        if (edgelessSelection.has(this.model.id) && edgelessSelection.editing) {
          this._editing = true;
        } else {
          this._editing = false;
        }
      })
    );

    this._resizeObserver.observe(this._textContainer);

    disposables.add(() => {
      this._resizeObserver.disconnect();
    });

    disposables.addFromEvent(this._textContainer, 'click', e => {
      if (!this._editing) return;

      const containerRect = this._textContainer.getBoundingClientRect();
      const isTop = e.clientY < containerRect.top + containerRect.height / 2;

      let newParagraphId: string | null = null;
      if (isTop) {
        const firstChild = this.model.firstChild();
        if (
          !firstChild ||
          !matchFlavours(firstChild, ['affine:list', 'affine:paragraph'])
        ) {
          newParagraphId = this.doc.addBlock(
            'affine:paragraph',
            {},
            this.model.id,
            0
          );
        }
      } else {
        const lastChild = this.model.lastChild();
        if (
          !lastChild ||
          !matchFlavours(lastChild, ['affine:list', 'affine:paragraph'])
        ) {
          newParagraphId = this.doc.addBlock(
            'affine:paragraph',
            {},
            this.model.id
          );
        }
      }

      if (newParagraphId) {
        this.rootService.selectionManager.setGroup('note', [
          this.rootService.selectionManager.create('text', {
            from: {
              blockId: newParagraphId,
              index: 0,
              length: 0,
            },
            to: null,
          }),
        ]);
      }
    });

    disposables.addFromEvent(this._textContainer, 'focusout', () => {
      if (!this._editing) return;

      this.rootService.selectionManager.clear();
    });
  }

  override getRenderingRect() {
    const { xywh, scale, rotate, hasMaxWidth } = this.model;
    const bound = Bound.deserialize(xywh);
    const w =
      hasMaxWidth || this._horizontalResizing || this.dragMoving
        ? bound.w / scale
        : undefined;

    return {
      x: bound.x,
      y: bound.y,
      w,
      h: bound.h / scale,
      rotate,
      zIndex: this.toZIndex(),
    };
  }

  override renderGfxBlock() {
    const { model } = this;
    const { scale, rotate, hasMaxWidth } = model;
    const containerStyle: StyleInfo = {
      transform: `rotate(${rotate}deg)`,
      transformOrigin: 'center',
      padding: '5px 10px',
      border: `1px solid ${this._editing ? 'var(--affine—primary—color, #1e96eb)' : 'transparent'}`,
      borderRadius: '4px',
      boxSizing: 'border-box',
      boxShadow: this._editing
        ? '0px 0px 0px 2px rgba(30, 150, 235, 0.3)'
        : 'none',
      fontWeight: '400',
      lineHeight: 'var(--affine-line-height)',
    };

    this.style.transform = `scale(${scale})`;

    return html`
      <div
        class="edgeless-text-block-container"
        data-max-width="${hasMaxWidth}"
        style=${styleMap(containerStyle)}
      >
        <div
          style=${styleMap({
            pointerEvents: this._editing ? 'auto' : 'none',
          })}
        >
          ${this.renderPageContent()}
        </div>
      </div>
    `;
  }

  override renderPageContent() {
    const { fontFamily, fontStyle, fontWeight, textAlign } = this.model;
    const color = ThemeObserver.generateColorProperty(
      this.model.color,
      '#000000'
    );

    const style = styleMap({
      color,
      fontFamily: TextUtils.wrapFontFamily(fontFamily),
      fontStyle,
      fontWeight,
      textAlign,
    });

    return html`
      <div style=${style} class="affine-edgeless-text-block-container">
        <div class="affine-block-children-container">
          ${this.renderChildren(this.model)}
        </div>
      </div>
    `;
  }

  tryFocusEnd() {
    const paragraphOrLists = Array.from(
      this.querySelectorAll<BlockComponent>('affine-paragraph, affine-list')
    );
    const last = paragraphOrLists.at(-1);
    if (last) {
      this.host.selection.setGroup('note', [
        this.host.selection.create('text', {
          from: {
            blockId: last.blockId,
            index: last.model.text?.length ?? 0,
            length: 0,
          },
          to: null,
        }),
      ]);
    }
  }

  @state()
  private accessor _editing = false;

  @query('.edgeless-text-block-container')
  private accessor _textContainer!: HTMLDivElement;

  @query('.affine-block-children-container')
  accessor childrenContainer!: HTMLDivElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-text': EdgelessTextBlockComponent;
  }
}
