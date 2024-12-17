import type { BaseSelection, UIEventStateContext } from '@blocksuite/block-std';

import { ShadowlessElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ImageBlockComponent } from '../image-block.js';

import { ImageResizeManager } from '../image-resize-manager.js';
import { shouldResizeImage } from '../utils.js';
import { ImageSelectedRect } from './image-selected-rect.js';

export class ImageBlockPageComponent extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-page-image {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 0;
      cursor: pointer;
    }

    affine-page-image .resizable-img {
      position: relative;
      max-width: 100%;
    }

    affine-page-image .resizable-img img {
      width: 100%;
      height: 100%;
    }
  `;

  private _isDragging = false;

  private get _doc() {
    return this.block.doc;
  }

  private get _host() {
    return this.block.host;
  }

  private get _model() {
    return this.block.model;
  }

  private _bindKeyMap() {
    const selection = this._host.selection;

    const addParagraph = (ctx: UIEventStateContext) => {
      const parent = this._doc.getParent(this._model);
      if (!parent) return;

      const index = parent.children.indexOf(this._model);
      const blockId = this._doc.addBlock(
        'affine:paragraph',
        {},
        parent,
        index + 1
      );

      const event = ctx.get('defaultState').event;
      event.preventDefault();

      selection.update(selList =>
        selList
          .filter<BaseSelection>(sel => !sel.is('image'))
          .concat(
            selection.create('text', {
              from: {
                blockId,
                index: 0,
                length: 0,
              },
              to: null,
            })
          )
      );
    };

    this.block.bindHotKey({
      Escape: () => {
        selection.update(selList => {
          return selList.map(sel => {
            const current =
              sel.is('image') && sel.blockId === this.block.blockId;
            if (current) {
              return selection.create('block', { blockId: this.block.blockId });
            }
            return sel;
          });
        });
        return true;
      },
      Delete: ctx => {
        if (this._host.doc.readonly || !this._isSelected) return;

        addParagraph(ctx);
        this._doc.deleteBlock(this._model);
        return true;
      },
      Backspace: ctx => {
        if (this._host.doc.readonly || !this._isSelected) return;

        addParagraph(ctx);
        this._doc.deleteBlock(this._model);
        return true;
      },
      Enter: ctx => {
        if (this._host.doc.readonly || !this._isSelected) return;

        addParagraph(ctx);
        return true;
      },
      ArrowDown: ctx => {
        const std = this._host.std;

        // If the selection is not image selection, we should not handle it.
        // eslint-disable-next-line unicorn/prefer-array-some
        if (!std.selection.find('image')) {
          return false;
        }

        const event = ctx.get('keyboardState');
        event.raw.preventDefault();

        std.command
          .chain()
          .getNextBlock({ path: this.block.blockId })
          .inline((ctx, next) => {
            const { nextBlock } = ctx;
            if (!nextBlock) return;

            return next({ focusBlock: nextBlock });
          })
          .focusBlockStart()
          .run();
        return true;
      },
      ArrowUp: ctx => {
        const std = this._host.std;

        // If the selection is not image selection, we should not handle it.
        // eslint-disable-next-line unicorn/prefer-array-some
        if (!std.selection.find('image')) {
          return false;
        }

        const event = ctx.get('keyboardState');
        event.raw.preventDefault();

        std.command
          .chain()
          .getPrevBlock({ path: this.block.blockId })
          .inline((ctx, next) => {
            const { prevBlock } = ctx;
            if (!prevBlock) return;

            return next({ focusBlock: prevBlock });
          })
          .focusBlockEnd()
          .run();
        return true;
      },
    });
  }

  private _handleError() {
    this.block.error = true;
  }

  private _handleSelection() {
    const selection = this._host.selection;
    this._disposables.add(
      selection.slots.changed.on(selList => {
        this._isSelected = selList.some(
          sel => sel.blockId === this.block.blockId && sel.is('image')
        );
      })
    );

    this._disposables.add(
      this._model.propsUpdated.on(() => {
        this.requestUpdate();
      })
    );

    this._disposables.addFromEvent(
      this.resizeImg,
      'click',
      (event: MouseEvent) => {
        // the peek view need handle shift + click
        if (event.shiftKey) return;

        event.stopPropagation();
        selection.update(selList => {
          return selList
            .filter(sel => !['block', 'image', 'text'].includes(sel.type))
            .concat(selection.create('image', { blockId: this.block.blockId }));
        });
        return true;
      }
    );

    this.block.handleEvent(
      'click',
      () => {
        if (!this._isSelected) return;

        selection.update(selList =>
          selList.filter(
            sel => !(sel.is('image') && sel.blockId === this.block.blockId)
          )
        );
      },
      {
        global: true,
      }
    );
  }

  private _normalizeImageSize() {
    // If is dragging, we should use the real size of the image
    if (this._isDragging && this.resizeImg) {
      return {
        width: this.resizeImg.style.width,
      };
    }

    const { width, height } = this._model;
    if (!width || !height) {
      return {
        width: 'unset',
        height: 'unset',
      };
    }

    return {
      width: `${width}px`,
    };
  }

  private _observeDrag() {
    const imageResizeManager = new ImageResizeManager();

    this._disposables.add(
      this._host.event.add('dragStart', ctx => {
        const pointerState = ctx.get('pointerState');
        const target = pointerState.event.target;
        if (shouldResizeImage(this, target)) {
          this._isDragging = true;
          imageResizeManager.onStart(pointerState);
          return true;
        }
        return false;
      })
    );

    this._disposables.add(
      this._host.event.add('dragMove', ctx => {
        const pointerState = ctx.get('pointerState');
        if (this._isDragging) {
          imageResizeManager.onMove(pointerState);
          return true;
        }
        return false;
      })
    );

    this._disposables.add(
      this._host.event.add('dragEnd', () => {
        if (this._isDragging) {
          this._isDragging = false;
          imageResizeManager.onEnd();
          return true;
        }
        return false;
      })
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    this._bindKeyMap();

    this._observeDrag();
  }

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);

    this._handleSelection();

    // The embed block can not be focused,
    // so the active element will be the last activated element.
    // If the active element is the title textarea,
    // any event will dispatch from it and be ignored. (Most events will ignore title)
    // so we need to blur it.
    // See also https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
    this.addEventListener('click', () => {
      if (
        document.activeElement &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }
    });
  }

  override render() {
    const imageSize = this._normalizeImageSize();

    const imageSelectedRect = this._isSelected
      ? ImageSelectedRect(this._doc.readonly)
      : null;

    return html`
      <div class="resizable-img" style=${styleMap(imageSize)}>
        <img
          class="drag-target"
          src=${this.block.blobUrl ?? ''}
          draggable="false"
          @error=${this._handleError}
          loading="lazy"
        />

        ${imageSelectedRect}
      </div>
    `;
  }

  @state()
  accessor _isSelected = false;

  @property({ attribute: false })
  accessor block!: ImageBlockComponent;

  @query('.resizable-img')
  accessor resizeImg!: HTMLElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-page-image': ImageBlockPageComponent;
  }
}
