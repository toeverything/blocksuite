import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { uploadImageFromLocal } from '../../../../__internal__/index.js';
import {
  type CssVariableName,
  isCssVariable,
} from '../../../../__internal__/theme/css-variables.js';
import type { FrameBlockModel } from '../../../../frame-block/index.js';
import {
  FrameImageGradientIcon,
  ImageUploadIcon,
  RenameIcon,
} from '../../../../icons/edgeless.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import { mountFrameEditor } from '../../utils/text.js';
import type { EdgelessToolIconButton } from '../buttons/tool-icon-button.js';
import type { ColorEvent } from '../panel/color-panel.js';
import { ColorUnit } from '../panel/color-panel.js';
import { createButtonPopper } from '../utils.js';

const FRAME_BACKGROUND: CssVariableName[] = [
  '--affine-tag-gray',
  '--affine-tag-red',
  '--affine-tag-orange',
  '--affine-tag-yellow',
  '--affine-tag-green',
  '--affine-tag-teal',
  '--affine-tag-blue',
  '--affine-tag-purple',
  '--affine-tag-pink',
  '--affine-palette-transparent',
];

enum FRAME_IMAGE_GRADIENT {
  GRADIENT1 = 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2))',
  GRADIENT2 = 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5))',
  GRADIENT3 = 'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2))',
  GRADIENT4 = 'linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5))',
  GRADIENT5 = `linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%)`,
  GRADIENT6 = `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)`,
  GRADIENT7 = `linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%)`,
  GRADIENT8 = `linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 100%)`,
}

@customElement('edgeless-change-frame-button')
export class EdgelessChangeFrameButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--affine-text-primary-color);
      stroke: none;
      fill: currentColor;
    }

    edgeless-color-panel {
      width: 168px;
    }

    .fill-color-button {
      margin-right: 8px;
    }

    .fill-color-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 20px;
      height: 20px;
    }

    .color-panel-container,
    .image-background-container {
      display: none;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    .image-background-container {
      width: 211px;
      padding: 8px 10px;
    }

    .color-panel-container[data-show],
    .image-background-container[data-show] {
      display: flex;
      gap: 12px;
    }
    component-toolbar-menu-divider {
      margin: 0 12px;
    }

    .image-upload {
      font-size: 12px;
      display: flex;
      flex-direction: column;
      flex: 1 1 63px;
      height: 52px;
      border-radius: 4px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .image-gradient {
      display: flex;
      flex-wrap: wrap;
      flex: 1 1 116px;
      gap: 12px;
      justify-content: space-between;
    }

    .current-gradient {
      border: 1px solid var(--affine-primary-color);
    }
  `;
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  frames: FrameBlockModel[] = [];

  @state()
  private _popperShow = false;

  @query('.fill-color-button')
  private _fillColorButton!: EdgelessToolIconButton;
  @query('.color-panel-container.fill-color')
  private _fillColorMenu!: HTMLDivElement;
  private _frameBackground: ReturnType<typeof createButtonPopper> | null = null;

  @query('.image-background-button')
  private _imageBackgroundButton!: EdgelessToolIconButton;
  @query('.image-background-container')
  private _imageBackgroundMenu!: HTMLDivElement;
  private _imageBackground: ReturnType<typeof createButtonPopper> | null = null;

  private _imageLoading = false;

  private _setFrameBackground(color: CssVariableName | string) {
    this.frames.forEach(frame => {
      this.surface.updateElement(frame.id, { background: color });
    });
  }

  private _setFrameImageGradient(gradient: FRAME_IMAGE_GRADIENT) {
    this.frames.forEach(frame => {
      this.surface.updateElement(frame.id, { gradient });
    });
  }

  override firstUpdated() {
    this._frameBackground = createButtonPopper(
      this._fillColorButton,
      this._fillColorMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );
    this._disposables.add(this._frameBackground);

    this._imageBackground = createButtonPopper(
      this._imageBackgroundButton,
      this._imageBackgroundMenu,
      ({ display }) => {
        this._popperShow = display === 'show';
      }
    );

    this._disposables.add(this._imageBackground);
  }

  private async _uploadImage() {
    if (this._imageLoading) return;
    this._imageLoading = true;

    const fileInfos = await uploadImageFromLocal(
      this.surface.edgeless.page.blobs
    );

    if (!fileInfos.length) {
      this._imageLoading = false;
      return;
    }
    this._setFrameBackground(fileInfos[0].sourceId);
    this._imageLoading = false;
  }

  protected override render() {
    const { frames } = this;
    const frame = frames[0];
    const source = isCssVariable(frame.background) ? '' : frame.source;
    const gradient = frame.gradient;
    let background = frame.background;
    background = isCssVariable(background)
      ? background
      : '--affine-palette-transparent';

    const imageUploadStyle = source
      ? {
          backgroundImage: `url(${source})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      : {};
    const gradientStyle = (value: FRAME_IMAGE_GRADIENT) => ({
      position: 'absolute',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: value,
      backgroundImage: `${value}, url(${source})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      top: '2px',
      left: '2px',
    });
    return html`${frames.length === 1
        ? html`
            <edgeless-tool-icon-button
              .tooltip=${'Rename'}
              .tipPosition=${'bottom'}
              @click=${() =>
                mountFrameEditor(this.frames[0], this.surface.edgeless)}
            >
              ${RenameIcon}Rename
            </edgeless-tool-icon-button>
            <component-toolbar-menu-divider
              .vertical=${true}
            ></component-toolbar-menu-divider>
          `
        : nothing}

      <edgeless-tool-icon-button
        class="fill-color-button"
        .tooltip=${this._popperShow ? '' : 'Background'}
        .tipPosition=${'bottom'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._frameBackground?.toggle()}
      >
        <div class="fill-color-container">${ColorUnit(background)}</div>
      </edgeless-tool-icon-button>
      <div class="color-panel-container fill-color">
        <edgeless-color-panel
          .value=${background}
          .options=${FRAME_BACKGROUND}
          @select=${(e: ColorEvent) => this._setFrameBackground(e.detail)}
        >
        </edgeless-color-panel>
      </div>
      <edgeless-tool-icon-button
        class="image-background-button"
        .tooltip=${this._popperShow ? '' : 'Image Background'}
        .tipPosition=${'bottom'}
        .active=${false}
        .iconContainerPadding=${2}
        @click=${() => this._imageBackground?.toggle()}
      >
        ${ImageUploadIcon}
      </edgeless-tool-icon-button>
      <div class="image-background-container">
        <div
          class="image-upload"
          style=${styleMap(imageUploadStyle)}
          @click=${() => this._uploadImage()}
        >
          ${source
            ? nothing
            : html`${ImageUploadIcon}
                <div>Upload</div>`}
        </div>
        <div class="image-gradient">
          ${repeat(
            Object.entries(FRAME_IMAGE_GRADIENT),
            ([key]) => key,
            ([_, value]) =>
              html`<div
                class=${gradient === value ? 'current-gradient' : ''}
                style=${styleMap({
                  display: 'flex',
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: '50%',
                })}
                @click=${() => source && this._setFrameImageGradient(value)}
              >
                ${source
                  ? html`<div
                      style=${styleMap({
                        width: '20px',
                        height: '20px',
                        visibility: 'hidden',
                      })}
                    ></div>`
                  : FrameImageGradientIcon}
                <div style=${styleMap(gradientStyle(value))}></div>
              </div>`
          )}
        </div>
      </div> `;
  }
}
