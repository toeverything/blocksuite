import '../buttons/tool-icon-button.js';
import '../buttons/toolbar-button.js';
import './shape/shape-tool-button.js';
import './brush/brush-tool-button.js';
import './connector/connector-tool-button.js';
import './note/note-tool-button.js';
import './frame/frame-order-button.js';
import './frame/frame-tool-button.js';
import './default/default-tool-button.js';
import './lasso/lasso-tool-button.js';
import './text/text-tool-button.js';
import './eraser/eraser-tool-button.js';
import './frame/navigator-setting-button.js';
import './template/template-tool-button.js';
import './presentation-toolbar.js';

import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import {
  EdgelessImageIcon,
  EdgelessTextIcon,
  FrameNavigatorIcon,
} from '../../../../_common/icons/index.js';
import type { EdgelessTool } from '../../../../_common/types.js';
import { stopPropagation } from '../../../../_common/utils/event.js';
import { getImageFilesFromLocal } from '../../../../_common/utils/filesys.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

@customElement('edgeless-toolbar')
export class EdgelessToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      position: absolute;
      z-index: 1;
      left: calc(50%);
      transform: translateX(-50%);
      bottom: 0;
      -webkit-user-select: none;
      user-select: none;
    }
    :host([disabled]) {
      pointer-events: none;
    }

    .edgeless-toolbar-toggle-control {
      padding-bottom: 28px;
    }
    .edgeless-toolbar-toggle-control[data-enable='true'] {
      transition: 0.23s ease;
      padding-top: 100px;
      transform: translateY(100px);
    }
    .edgeless-toolbar-toggle-control[data-enable='true']:hover {
      padding-top: 0;
      transform: translateY(0);
    }

    .edgeless-toolbar-container {
      position: relative;
      display: flex;
      align-items: center;
      flex-direction: row;
      padding: 0 20px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border: 1px solid var(--affine-border-color);
      border-radius: 40px;
      height: 64px;
    }
    .edgeless-toolbar-container[level='second'] {
      position: absolute;
      bottom: 8px;
      transform: translateY(-100%);
    }
    .edgeless-toolbar-container[hidden] {
      display: none;
    }
    .edgeless-toolbar-left-part {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .short-divider {
      width: 1px;
      height: 24px;
      margin: 0 10px;
      background-color: var(--affine-border-color);
    }
    .full-divider {
      width: 1px;
      height: 100%;
      margin: 0 12px;
      background-color: var(--affine-border-color);
    }
    .brush-and-eraser {
      display: flex;
      margin-left: 8px;
    }
    .edgeless-toolbar-right-part {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-left: 12px;
    }
    .transform-button svg {
      transition: 0.3s ease-in-out;
    }
    .transform-button:hover svg {
      transform: scale(1.15);
    }
  `;

  edgeless: EdgelessRootBlockComponent;

  constructor(edgeless: EdgelessRootBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  private get _cachedPresentHideToolbar() {
    return !!this.edgeless.service.editPropsStore.getItem('presentHideToolbar');
  }

  @state()
  accessor presentSettingMenuShow = false;
  @state()
  accessor presentFrameMenuShow = false;

  /**
   * When enabled, the toolbar will auto-hide when the mouse is not over it.
   */
  private get _enableAutoHide() {
    return (
      this.isPresentMode &&
      this._cachedPresentHideToolbar &&
      !this.presentSettingMenuShow &&
      !this.presentFrameMenuShow
    );
  }
  get host() {
    return this.edgeless.host;
  }

  get edgelessTool() {
    return this.edgeless.edgelessTool;
  }

  get isPresentMode() {
    return this.edgelessTool.type === 'frameNavigator';
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.tools.setEdgelessTool(edgelessTool);
  };

  private _imageLoading = false;

  private async _addImages() {
    this._imageLoading = true;
    const imageFiles = await getImageFilesFromLocal();
    await this.edgeless.addImages(imageFiles);
    this._imageLoading = false;
  }

  override firstUpdated() {
    const { _disposables, edgeless } = this;

    _disposables.add(
      edgeless.service.viewport.viewportUpdated.on(() => this.requestUpdate())
    );
    _disposables.add(
      edgeless.slots.readonlyUpdated.on(() => {
        this.requestUpdate();
      })
    );
    _disposables.add(
      edgeless.slots.toolbarLocked.on(disabled => {
        this.toggleAttribute('disabled', disabled);
      })
    );
    _disposables.add(
      edgeless.slots.edgelessToolUpdated.on(() => this.requestUpdate())
    );
    // This state from `editPropsStore` is not reactive,
    // if the value is updated outside of this component, it will not be reflected.
    _disposables.add(
      this.edgeless.service.editPropsStore.slots.itemUpdated.on(({ key }) => {
        if (key === 'presentHideToolbar') {
          this.requestUpdate();
        }
      })
    );
  }

  private _Tools() {
    const { edgelessTool } = this.edgeless;
    const { type } = edgelessTool;
    return html`
      <div class="full-divider"></div>

      <div class="brush-and-eraser">
        <edgeless-brush-tool-button
          .edgeless=${this.edgeless}
          .active=${type === 'brush'}
        ></edgeless-brush-tool-button>

        <edgeless-eraser-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-eraser-tool-button>
      </div>

      <div class="edgeless-toolbar-right-part">
        <edgeless-shape-tool-button
          .edgeless=${this.edgeless}
          .active=${type === 'shape'}
        ></edgeless-shape-tool-button>

        <edgeless-text-tool-button
          .edgeless=${this.edgeless}
          .active=${type === 'text'}
        >
          ${EdgelessTextIcon}
        </edgeless-text-tool-button>

        <edgeless-toolbar-button
          class="transform-button"
          .disabled=${this._imageLoading}
          .activeMode=${'background'}
          .tooltip=${'Image'}
          .tooltipOffset=${12}
          @click=${() => this._addImages()}
        >
          ${EdgelessImageIcon}
        </edgeless-toolbar-button>

        <edgeless-template-button .edgeless=${this.edgeless}>
        </edgeless-template-button>
      </div>
    `;
  }

  private get _DefaultContent() {
    const { doc, edgelessTool } = this.edgeless;
    const { type } = edgelessTool;

    return html`<div class="edgeless-toolbar-left-part">
        <edgeless-default-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-default-tool-button>

        ${doc.awarenessStore.getFlag('enable_lasso_tool')
          ? html`<edgeless-lasso-tool-button
              .edgelessTool=${this.edgelessTool}
              .edgeless=${this.edgeless}
              .setEdgelessTool=${this.setEdgelessTool}
            ></edgeless-lasso-tool-button>`
          : nothing}

        <edgeless-connector-tool-button
          .edgeless=${this.edgeless}
          .active=${type === 'connector'}
        ></edgeless-connector-tool-button>

        ${doc.readonly
          ? nothing
          : html` <edgeless-frame-tool-button
              .edgelessTool=${this.edgelessTool}
              .setEdgelessTool=${this.setEdgelessTool}
              .edgeless=${this.edgeless}
            ></edgeless-frame-tool-button>`}

        <edgeless-tool-icon-button
          class="edgeless-frame-navigator-button"
          .tooltip=${'Present'}
          .tooltipOffset=${17}
          .iconContainerPadding=${8}
          @click=${() => {
            this.setEdgelessTool({
              type: 'frameNavigator',
            });
          }}
        >
          ${FrameNavigatorIcon}
        </edgeless-tool-icon-button>
      </div>

      ${doc.readonly
        ? nothing
        : html`
            <div class="short-divider"></div>
            <edgeless-note-tool-button
              .edgeless=${this.edgeless}
              .active=${type === 'affine:note'}
            ></edgeless-note-tool-button>
          `}
      ${this._Tools()} `;
  }

  override render() {
    const { type } = this.edgelessTool;
    if (this.edgeless.doc.readonly && type !== 'frameNavigator') {
      return nothing;
    }

    return html`
      <div
        class="edgeless-toolbar-toggle-control"
        data-enable=${this._enableAutoHide}
      >
        <div
          class="edgeless-toolbar-container"
          @dblclick=${stopPropagation}
          @mousedown=${stopPropagation}
          @pointerdown=${stopPropagation}
        >
          <presentation-toolbar
            .visible=${this.isPresentMode}
            .edgeless=${this.edgeless}
            .settingMenuShow=${this.presentSettingMenuShow}
            .frameMenuShow=${this.presentFrameMenuShow}
            .setSettingMenuShow=${(show: boolean) =>
              (this.presentSettingMenuShow = show)}
            .setFrameMenuShow=${(show: boolean) =>
              (this.presentFrameMenuShow = show)}
          ></presentation-toolbar>
          ${this.isPresentMode ? nothing : this._DefaultContent}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar': EdgelessToolbar;
  }
}
