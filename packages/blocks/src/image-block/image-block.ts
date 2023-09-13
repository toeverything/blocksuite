import './image/placeholder/image-not-found.js';
import './image/placeholder/loading-card.js';

import { PathFinder } from '@blocksuite/block-std';
import { BlockElement } from '@blocksuite/lit';
import { css, html, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { stopPropagation } from '../__internal__/utils/event.js';
import { DragHandleWidget } from '../widgets/drag-handle/index.js';
import { captureEventTarget } from '../widgets/drag-handle/utils.js';
import { ImageResizeManager } from './image/image-resize-manager.js';
import { ImageSelectedRectsContainer } from './image/image-selected-rects.js';
import { type ImageBlockModel, ImageBlockSchema } from './image-model.js';

@customElement('affine-image')
export class ImageBlockComponent extends BlockElement<ImageBlockModel> {
  static maxRetryCount = 3;

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

    /* hover area */
    .resizable-img::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 50px;
      height: 100%;
      transform: translateX(100%);
    }
  `;

  @query('input')
  _input!: HTMLInputElement;

  @query('.resizable-img')
  public readonly resizeImg!: HTMLElement;

  @state()
  private _caption!: string;

  @state()
  private _source!: string;

  blob!: Blob;

  @state()
  private _imageState: 'waitUploaded' | 'loading' | 'ready' | 'failed' =
    'loading';

  @state()
  _focused = false;

  private _retryCount = 0;
  private _lastSourceId: string = '';

  override connectedCallback() {
    super.connectedCallback();
    this._fetchImage();
    this._disposables.add(this.model.propsUpdated.on(this._fetchImage));

    this._bindKeymap();
    this._handleSelection();

    this._observeDrag();
    this._registerDragHandleOption();
  }

  override disconnectedCallback() {
    if (this._source) {
      URL.revokeObjectURL(this._source);
    }
    super.disconnectedCallback();
  }

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);

    // exclude padding and border width
    const { width, height } = this.model;

    if (width && height) {
      this.resizeImg.style.width = width + 'px';
      this.resizeImg.style.height = height + 'px';
    }

    this.updateComplete.then(() => {
      this._caption = this.model?.caption ?? '';

      if (this._caption.length > 0) {
        // Caption input should be toggled manually.
        // Otherwise it will be lost if the caption is deleted into empty state.
        this._input.classList.add('caption-show');
      }
    });

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

  private _registerDragHandleOption = () => {
    this._disposables.add(
      DragHandleWidget.registerOption({
        flavour: ImageBlockSchema.model.flavour,
        onDragStart: (state, startDragging) => {
          // Check if start dragging from the image block
          const target = captureEventTarget(state.raw.target);
          const insideImageBlock = target?.closest('.resizable-img');
          if (!insideImageBlock || this._shouldResizeImage(state.raw.target))
            return false;

          // If start dragging from the image element
          // Set selection and take over dragStart event to start dragging
          const imageBlock = target?.closest('affine-image');
          if (!imageBlock) return false;

          this.root.selection.set([
            this.root.selection.getInstance('block', {
              path: imageBlock.path,
            }),
          ]);
          startDragging([imageBlock], state);
          return true;
        },
      })
    );
  };

  private _onInputChange() {
    this._caption = this._input.value;
    this.model.page.updateBlock(this.model, { caption: this._caption });
  }

  private _onInputBlur() {
    if (!this._caption) {
      this._input.classList.remove('caption-show');
    }
  }

  private _fetchError = (e: unknown) => {
    // Do have the id but cannot find the blob
    //  this is probably because the blob is not uploaded yet
    this._imageState = 'waitUploaded';
    this._retryCount++;
    console.warn('Cannot find blob, retrying', this._retryCount);
    if (this._retryCount < ImageBlockComponent.maxRetryCount) {
      setTimeout(() => {
        this._fetchImage();
        // 1s, 2s, 3s
      }, 1000 * this._retryCount);
    } else {
      console.error(e);
      this._imageState = 'failed';
    }
  };

  private _fetchImage = () => {
    if (
      this._imageState === 'ready' &&
      this._lastSourceId &&
      this._lastSourceId === this.model.sourceId
    ) {
      return;
    }

    const storage = this.model.page.blobs;
    this._imageState = 'loading';
    storage
      .get(this.model.sourceId)
      .then(blob => {
        if (blob) {
          this.blob = blob;
          this._source = URL.createObjectURL(blob);
          this._lastSourceId = this.model.sourceId;
          this._imageState = 'ready';
        } else {
          this._fetchError(new Error('Cannot find blob'));
        }
      })
      .catch(this._fetchError);
  };

  private _shouldResizeImage = (target: EventTarget | null) => {
    return !!(
      target &&
      target instanceof HTMLElement &&
      this.contains(target) &&
      target.classList.contains('resize')
    );
  };

  private _observeDrag() {
    const embedResizeManager = new ImageResizeManager();

    let dragging = false;
    this._disposables.add(
      this.root.event.add('dragStart', ctx => {
        const pointerState = ctx.get('pointerState');
        const target = pointerState.event.target;
        if (this._shouldResizeImage(target)) {
          dragging = true;
          embedResizeManager.onStart(pointerState);
          return true;
        }
        return false;
      })
    );
    this._disposables.add(
      this.root.event.add('dragMove', ctx => {
        const pointerState = ctx.get('pointerState');
        if (dragging) {
          embedResizeManager.onMove(pointerState);
          return true;
        }
        return false;
      })
    );
    this._disposables.add(
      this.root.event.add('dragEnd', () => {
        if (dragging) {
          dragging = false;
          embedResizeManager.onEnd();
          return true;
        }
        return false;
      })
    );
  }

  private _handleSelection() {
    const selection = this.root.selection;
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
          .concat(selection.getInstance('image', { path: this.path }));
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
    const selection = this.root.selection;
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
              selection.getInstance('text', {
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
              return selection.getInstance('block', { path: this.path });
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
    if (!isFocused || this._imageState !== 'ready') return null;
    const readonly = this.model.page.readonly;
    return ImageSelectedRectsContainer(readonly);
  }

  override render() {
    const resizeImgStyle = {
      width: 'unset',
      height: 'unset',
    };
    const { width, height } = this.model;
    if (width && height) {
      resizeImgStyle.width = `${width}px`;
      resizeImgStyle.height = `${height}px`;
    }

    const img = {
      waitUploaded: html`<affine-image-block-loading-card
        content="Delivering content..."
      ></affine-image-block-loading-card>`,
      loading: html`<affine-image-block-loading-card
        content="Loading content..."
      ></affine-image-block-loading-card>`,
      ready: html`<img src=${this._source} draggable="false" />`,
      failed: html`<affine-image-block-not-found-card></affine-image-block-not-found-card>`,
    }[this._imageState];

    return html`
      <div style="position: relative;">
        <div class="affine-image-wrapper">
          <div class="resizable-img" style=${styleMap(resizeImgStyle)}>
            ${img} ${this._imageResizeBoardTemplate()}
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
            @keydown=${stopPropagation}
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
    'affine-image': ImageBlockComponent;
  }
}
