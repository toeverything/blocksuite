import './image/placeholder/image-not-found.js';
import './image/placeholder/loading-card.js';

import { PathFinder } from '@blocksuite/block-std';
import { BlockElement } from '@blocksuite/lit';
import { Text } from '@blocksuite/store';
import { css, html, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { stopPropagation } from '../_common/utils/event.js';
import { asyncFocusRichText } from '../_common/utils/selection.js';
import { AffineDragHandleWidget } from '../_common/widgets/drag-handle/index.js';
import { captureEventTarget } from '../_common/widgets/drag-handle/utils.js';
import { Bound } from '../surface-block/index.js';
import { ImageResizeManager } from './image/image-resize-manager.js';
import { ImageSelectedRectsContainer } from './image/image-selected-rects.js';
import { shouldResizeImage } from './image/utils.js';
import { type ImageBlockModel, ImageBlockSchema } from './image-model.js';

const MAX_RETRY_COUNT = 3;

@customElement('affine-image')
export class ImageBlockComponent extends BlockElement<ImageBlockModel> {
  @query('affine-page-image')
  _pageImage!: ImageBlockPageComponent;

  @query('affine-edgeless-image')
  _edgelessImage!: ImageBlockEdgelessComponent;

  private get _current() {
    return this._isInSurface ? this._edgelessImage : this._pageImage;
  }

  private _isInSurface = false;

  override connectedCallback() {
    super.connectedCallback();
    const parent = this.root.page.getParent(this.model);
    this._isInSurface = parent?.flavour === 'affine:surface';
  }

  get resizeImg() {
    return this._pageImage.resizeImg;
  }

  get blob() {
    return this._current.blob;
  }

  override render() {
    if (this._isInSurface) {
      return html`<affine-edgeless-image
        .model=${this.model}
        .page=${this.page}
        .root=${this.root}
        .widgets=${this.widgets}
        .content=${this.content}
      ></affine-edgeless-image>`;
    } else {
      return html`<affine-page-image
        .model=${this.model}
        .page=${this.page}
        .root=${this.root}
        .widgets=${this.widgets}
        .content=${this.content}
      ></affine-page-image>`;
    }
  }
}

class ImageBlock extends BlockElement<ImageBlockModel> {
  @state()
  protected _source!: string;

  blob?: Blob;

  @state()
  protected _imageState: 'waitUploaded' | 'loading' | 'ready' | 'failed' =
    'loading';

  private _retryCount = 0;
  private _lastSourceId: string = '';

  private _fetchError = (e: unknown) => {
    // Do have the id but cannot find the blob
    //  this is probably because the blob is not uploaded yet
    this._imageState = 'waitUploaded';
    this._retryCount++;
    console.warn('Cannot find blob, retrying', this._retryCount);
    if (this._retryCount < MAX_RETRY_COUNT) {
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

    const storage = this.model.page.blob;
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

  override connectedCallback() {
    super.connectedCallback();
    this._fetchImage();
  }

  override disconnectedCallback() {
    if (this._source) {
      URL.revokeObjectURL(this._source);
    }
    super.disconnectedCallback();
  }
}

@customElement('affine-edgeless-image')
class ImageBlockEdgelessComponent extends ImageBlock {
  get surface() {
    return this.closest('affine-surface');
  }

  override render() {
    const bound = Bound.deserialize(
      ((this.surface?.pickById(this.model.id) as ImageBlockModel) ?? this.model)
        .xywh
    );

    return html`<img
      style=${styleMap({
        transform: `rotate(${this.model.rotate}deg)`,
        transfromOrigin: 'center',
      })}
      src=${this._source}
      width="${bound.w}px"
      height="${bound.h}px"
    />`;
  }
}

@customElement('affine-page-image')
export class ImageBlockPageComponent extends ImageBlock {
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
    this._registerDragHandleOption();
  }

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
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
      AffineDragHandleWidget.registerOption({
        flavour: ImageBlockSchema.model.flavour,
        onDragStart: (state, startDragging) => {
          // Check if start dragging from the image block
          const target = captureEventTarget(state.raw.target);
          const insideImageBlock = target?.closest('.resizable-img');
          if (!insideImageBlock) return false;

          // If start dragging from the image element
          // Set selection and take over dragStart event to start dragging
          const imageBlock = target?.closest('affine-image');
          if (!imageBlock || shouldResizeImage(imageBlock, target))
            return false;

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

  private _observeDrag() {
    const embedResizeManager = new ImageResizeManager();

    this._disposables.add(
      this.root.event.add('dragStart', ctx => {
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
      this.root.event.add('dragMove', ctx => {
        const pointerState = ctx.get('pointerState');
        if (this._isDragging) {
          embedResizeManager.onMove(pointerState);
          return true;
        }
        return false;
      })
    );
    this._disposables.add(
      this.root.event.add('dragEnd', () => {
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
    if (e.isComposing) return;
    if (e.key === 'Enter') {
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
      asyncFocusRichText(model.page, id);
    }
  }

  override render() {
    const resizeImgStyle = this._normalizeImageSize();

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
    'affine-image': ImageBlockComponent;
    'affine-page-image': ImageBlockPageComponent;
    'affine-edgeless-image': ImageBlockEdgelessComponent;
  }
}
