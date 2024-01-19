import { PathFinder } from '@blocksuite/block-std';
import { BlockElement } from '@blocksuite/lit';
import { Text } from '@blocksuite/store';
import { css, html, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { stopPropagation } from '../_common/utils/index.js';
import { asyncFocusRichText } from '../_common/utils/selection.js';
import { ImageSelectedRectsContainer } from './components/image-selected-rects.js';
import type { ImageBlockModel } from './image-model.js';
import { ImageResizeManager } from './image-resize-manager.js';
import { shouldResizeImage } from './utils.js';

@customElement('affine-page-image')
export class ImageBlockPageComponent extends BlockElement<ImageBlockModel> {
  static override styles = css`
    affine-image {
      display: block;
    }

    .affine-embed-wrapper {
      text-align: center;
      margin-bottom: 18px;
    }

    .affine-embed-wrapper-caption {
      width: 100%;
      font-size: var(--affine-font-sm);
      outline: none;
      border: 0;
      font-family: inherit;
      text-align: center;
      color: var(--affine-icon-color);
      display: none;
      background: transparent;
    }

    .affine-embed-wrapper-caption::placeholder {
      color: var(--affine-placeholder-color);
    }

    .affine-embed-wrapper .caption-show {
      display: inline-block;
    }

    .affine-image-wrapper {
      padding: 8px;
      width: 100%;
      text-align: center;
      line-height: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: 18px;
    }

    .affine-image-wrapper img {
      max-width: 100%;
      margin: auto;
      width: 100%;
    }

    .resizable-img {
      position: relative;
      border-radius: 8px;
      cursor: pointer;
    }

    .resizable-img img {
      width: 100%;
    }
  `;

  @property()
  source!: string;

  @query('input')
  _input!: HTMLInputElement;

  @query('.resizable-img')
  public readonly resizeImg?: HTMLElement;

  @state()
  private _caption!: string;

  @state()
  _focused = false;

  private _isDragging = false;

  override connectedCallback() {
    super.connectedCallback();

    this._bindKeymap();
    this._handleSelection();

    this._observeDrag();
  }

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.updateComplete
      .then(() => {
        this._caption = this.model?.caption ?? '';

        if (this._caption.length > 0) {
          // Caption input should be toggled manually.
          // Otherwise it will be lost if the caption is deleted into empty state.
          this._input.classList.add('caption-show');
        }
      })
      .catch(console.error);

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

  private _onInputChange() {
    this._caption = this._input.value;
    this.model.page.updateBlock(this.model, { caption: this._caption });
  }

  private _onInputBlur() {
    if (!this._caption) {
      this._input.classList.remove('caption-show');
    }
  }

  private _observeDrag() {
    const embedResizeManager = new ImageResizeManager();

    this._disposables.add(
      this.host.event.add('dragStart', ctx => {
        const pointerState = ctx.get('pointerState');
        const target = pointerState.event.target;
        if (shouldResizeImage(this, target)) {
          this._isDragging = true;
          embedResizeManager.onStart(pointerState);
          return true;
        }
        return false;
      })
    );

    this._disposables.add(
      this.host.event.add('dragMove', ctx => {
        const pointerState = ctx.get('pointerState');
        if (this._isDragging) {
          embedResizeManager.onMove(pointerState);
          return true;
        }
        return false;
      })
    );

    this._disposables.add(
      this.host.event.add('dragEnd', () => {
        if (this._isDragging) {
          this._isDragging = false;
          embedResizeManager.onEnd();
          return true;
        }
        return false;
      })
    );
  }

  private _handleSelection() {
    const selection = this.host.selection;
    this._disposables.add(
      selection.slots.changed.on(selList => {
        const curr = selList.find(
          sel => PathFinder.equals(sel.path, this.path) && sel.is('image')
        );

        this._focused = !!curr;
      })
    );

    this.handleEvent('click', () => {
      selection.update(selList => {
        return selList
          .filter(sel => {
            return !['text', 'block', 'image'].includes(sel.type);
          })
          .concat(selection.create('image', { path: this.path }));
      });
      return true;
    });

    this.handleEvent(
      'click',
      () => {
        if (!this._focused) return;

        selection.update(selList => {
          return selList.filter(sel => {
            const current =
              sel.is('image') && PathFinder.equals(sel.path, this.path);
            return !current;
          });
        });
      },
      {
        global: true,
      }
    );
  }

  private _bindKeymap() {
    const selection = this.host.selection;
    const addParagraph = () => {
      const parent = this.page.getParent(this.model);
      if (!parent) return;
      const index = parent.children.indexOf(this.model);
      const blockId = this.page.addBlock(
        'affine:paragraph',
        {},
        parent,
        index + 1
      );
      requestAnimationFrame(() => {
        selection.update(selList => {
          return selList
            .filter(sel => !sel.is('image'))
            .concat(
              selection.create('text', {
                from: {
                  path: this.parentPath.concat(blockId),
                  index: 0,
                  length: 0,
                },
                to: null,
              })
            );
        });
      });
    };

    this.bindHotKey({
      Escape: () => {
        selection.update(selList => {
          return selList.map(sel => {
            const current =
              sel.is('image') && PathFinder.equals(sel.path, this.path);
            if (current) {
              return selection.create('block', { path: this.path });
            }
            return sel;
          });
        });
        return true;
      },
      Delete: () => {
        if (!this._focused) return;
        addParagraph();
        this.page.deleteBlock(this.model);
        return true;
      },
      Backspace: () => {
        if (!this._focused) return;
        addParagraph();
        this.page.deleteBlock(this.model);
        return true;
      },
      Enter: () => {
        if (!this._focused) return;
        addParagraph();
        return true;
      },
    });
  }

  private _imageResizeBoardTemplate() {
    const isFocused = this._focused;
    if (!isFocused) return null;

    const readonly = this.model.page.readonly;
    return ImageSelectedRectsContainer(readonly);
  }

  private _normalizeImageSize() {
    // If is dragging, we should use the real size of the image
    if (this._isDragging && this.resizeImg) {
      return {
        width: this.resizeImg.style.width,
        height: this.resizeImg.style.height,
      };
    }

    const { width, height } = this.model;
    if (!width || !height || width === 0 || height === 0) {
      return {
        width: 'unset',
        height: 'unset',
      };
    }
    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  }

  private _onCaptionKeydown(e: KeyboardEvent) {
    this.std.event.activate();
    if (e.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const model = this.model;
      const page = model.page;
      const target = e.target as HTMLInputElement;
      const start = target.selectionStart;
      if (start === null) return;

      const value = target.value;
      const caption = (this._caption = value.slice(0, start));
      target.value = caption;
      page.updateBlock(model, { caption });

      const nextBlockText = value.slice(start);
      const parent = page.getParent(model);
      if (!parent) return;
      const index = parent.children.indexOf(model);
      const id = page.addBlock(
        'affine:paragraph',
        { text: new Text(nextBlockText) },
        parent,
        index + 1
      );
      asyncFocusRichText(this.host, model.page, id)?.catch(console.error);
    }
  }

  override render() {
    const resizeImgStyle = this._normalizeImageSize();

    return html`
      <div style="position: relative;">
        <div class="affine-image-wrapper">
          <div class="resizable-img" style=${styleMap(resizeImgStyle)}>
            <img src=${this.source} draggable="false" />
            ${this._imageResizeBoardTemplate()}
          </div>
        </div>
        ${this.selected?.is('block')
          ? html`<affine-block-selection></affine-block-selection>`
          : null}
      </div>

      <div class="affine-embed-block-container">
        <div class="affine-embed-wrapper">
          <input
            .disabled=${this.model.page.readonly}
            placeholder="Write a caption"
            class="affine-embed-wrapper-caption"
            value=${this._caption}
            @input=${this._onInputChange}
            @blur=${this._onInputBlur}
            @click=${stopPropagation}
            @keydown=${this._onCaptionKeydown}
            @keyup=${stopPropagation}
            @pointerdown=${stopPropagation}
            @pointerup=${stopPropagation}
            @pointermove=${stopPropagation}
            @paste=${stopPropagation}
            @cut=${stopPropagation}
            @copy=${stopPropagation}
          />
        </div>
      </div>
      ${Object.values(this.widgets)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-page-image': ImageBlockPageComponent;
  }
}
