import './component-toolbar-menu-divider.js';

import { WithDisposable } from '@blocksuite/lit';
import { css, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { RenameIcon } from '../../../../_common/icons/index.js';
import type { CssVariableName } from '../../../../_common/theme/css-variables.js';
import type { FrameBlockModel } from '../../../../frame-block/index.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import { mountFrameTitleEditor } from '../../utils/text.js';
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
      /* margin-right: 8px; */
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

    .color-panel-container[data-show],
    .image-background-container[data-show] {
      display: flex;
    }
    component-toolbar-menu-divider {
      margin: 0 12px;
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

  // @query('.image-background-button')
  // private _imageBackgroundButton!: EdgelessToolIconButton;
  // @query('.image-background-container')
  // private _imageBackgroundMenu!: HTMLDivElement;
  // private _imageBackground: ReturnType<typeof createButtonPopper> | null = null;

  private _setFrameBackground(color: CssVariableName) {
    this.frames.forEach(frame => {
      this.surface.updateElement(frame.id, { background: color });
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

    // this._imageBackground = createButtonPopper(
    //   this._imageBackgroundButton,
    //   this._imageBackgroundMenu,
    //   ({ display }) => {
    //     this._popperShow = display === 'show';
    //   }
    // );

    // this._disposables.add(this._imageBackground);
  }

  protected override render() {
    const { frames } = this;

    const background = frames[0].background;
    return html`${frames.length === 1
        ? html`
            <edgeless-tool-icon-button
              .tooltip=${'Rename'}
              .tipPosition=${'bottom'}
              @click=${() =>
                mountFrameTitleEditor(this.frames[0], this.surface.edgeless)}
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
      </div> `;
  }
}
// <!-- <edgeless-tool-icon-button
//                 class='image-background-button'
//         .tooltip=${this._popperShow ? '' : 'Image Background'}
//         .tipPosition=${'bottom'}
//         .active=${false}
//         .iconContainerPadding=${2}
//         @click=${() => this._imageBackground?.toggle()}
//       >
//         ${ImageUploadIcon}
//       </edgeless-tool-icon-button>
//       <div class='image-background-container'>
//                 <div>123</div>
//       </div> -->
