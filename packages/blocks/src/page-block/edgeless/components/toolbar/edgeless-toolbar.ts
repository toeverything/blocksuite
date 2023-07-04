import '../buttons/tool-icon-button.js';
import '../buttons/toolbar-button.js';
import './shape/shape-tool-button.js';
import './brush/brush-tool-button.js';
import './connector/connector-tool-button.js';
import './note/note-tool-button.js';

import {
  EdgelessEraserIcon,
  EdgelessImageIcon,
  EdgelessTextIcon,
  HandIcon,
  SelectIcon,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { stopPropagation } from '../../../../__internal__/utils/event.js';
import { uploadImageFromLocal } from '../../../../__internal__/utils/filesys.js';
import type { EdgelessTool } from '../../../../__internal__/utils/types.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getTooltipWithShortcut } from '../utils.js';

@customElement('edgeless-toolbar')
export class EdgelessToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      z-index: 3;
      bottom: 28px;
      left: calc(50%);
      display: flex;
      justify-content: center;
      transform: translateX(-50%);
      user-select: none;
    }
    .edgeless-toolbar-container {
      display: flex;
      align-items: center;
      flex-direction: row;
      padding: 0 12px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 40px;
      fill: currentcolor;
    }
    .edgeless-toolbar-container[level='second'] {
      position: absolute;
      bottom: 8px;
      transform: translateY(-100%);
    }
    .edgeless-toolbar-container[hidden] {
      display: none;
    }
    .short-divider {
      width: 1px;
      height: 24px;
      margin: 0 7px;
      background-color: var(--affine-border-color);
    }
    .full-divider {
      width: 1px;
      height: 100%;
      margin: 0 7px;
      background-color: var(--affine-border-color);
    }
    .brush-and-eraser {
      display: flex;
      margin-left: 8px;
    }
    .eraser-button {
      position: relative;
      height: 66px;
      width: 30px;
      overflow-y: hidden;
    }
    #edgeless-eraser-icon {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      transition: top 0.3s ease-in-out;
    }
    #edgeless-eraser-icon:hover {
      top: 2px;
    }
    .edgeless-right-part {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-left: 12px;
    }
    .transform-button svg {
      transition: 0.3s ease-in-out;
    }
    .transform-button:hover svg {
      transform: scale(1.15);
    }
  `;

  edgeless: EdgelessPageBlockComponent;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  get edgelessTool() {
    return this.edgeless.edgelessTool;
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.selection.setEdgelessTool(edgelessTool);
  };

  private _imageLoading = false;

  private async _addImages() {
    this._imageLoading = true;

    const fileInfos = await uploadImageFromLocal(this.edgeless.page.blobs);

    if (!fileInfos.length) {
      this._imageLoading = false;
      return;
    }

    await this.edgeless.addImages(fileInfos);

    this._imageLoading = false;
  }

  override firstUpdated() {
    const {
      _disposables,
      edgeless: { slots },
    } = this;
    _disposables.add(
      slots.edgelessToolUpdated.on(() => {
        this._trySaveBrushStateLocalRecord();
        this.requestUpdate();
      })
    );
    _disposables.add(slots.viewportUpdated.on(() => this.requestUpdate()));
  }

  private _trySaveBrushStateLocalRecord = () => {
    const edgelessTool = this.edgeless.selection.edgelessTool;
    if (edgelessTool.type === 'brush') {
      sessionStorage.setItem(
        'blocksuite:' + this.edgeless.page.id + ':edgelessBrush',
        JSON.stringify({
          color: edgelessTool.color,
          lineWidth: edgelessTool.lineWidth,
        })
      );
    }
  };

  override render() {
    const { type } = this.edgelessTool;

    return html`
      <div
        class="edgeless-toolbar-container"
        @dblclick=${stopPropagation}
        @mousedown=${stopPropagation}
        @mouseup=${stopPropagation}
        @pointerdown=${stopPropagation}
      >
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Select', 'V')}
          .active=${type === 'default'}
          @click=${() => this.setEdgelessTool({ type: 'default' })}
        >
          ${SelectIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${getTooltipWithShortcut('Hand', 'H')}
          .active=${type === 'pan'}
          @click=${() => this.setEdgelessTool({ type: 'pan', panning: false })}
        >
          ${HandIcon}
        </edgeless-tool-icon-button>
        <div class="short-divider"></div>
        <edgeless-note-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-note-tool-button>
        <div class="full-divider"></div>
        <div class="brush-and-eraser">
          <edgeless-brush-tool-button
            .edgelessTool=${this.edgelessTool}
            .edgeless=${this.edgeless}
            .setEdgelessTool=${this.setEdgelessTool}
          ></edgeless-brush-tool-button>
          <edgeless-toolbar-button
            .tooltip=${getTooltipWithShortcut('Eraser', 'E')}
            .active=${type === 'eraser'}
            .activeMode=${'background'}
            @click=${() => this.setEdgelessTool({ type: 'eraser' })}
          >
            <div class="eraser-button">${EdgelessEraserIcon}</div>
          </edgeless-toolbar-button>
        </div>
        <div class="edgeless-right-part">
          <edgeless-toolbar-button
            class="transform-button"
            .tooltip=${getTooltipWithShortcut('Text', 'T')}
            .active=${type === 'text'}
            .activeMode=${'background'}
            @click=${() => this.setEdgelessTool({ type: 'text' })}
          >
            ${EdgelessTextIcon}
          </edgeless-toolbar-button>
          <edgeless-shape-tool-button
            .edgelessTool=${this.edgelessTool}
            .edgeless=${this.edgeless}
            .setEdgelessTool=${this.setEdgelessTool}
          ></edgeless-shape-tool-button>
          <edgeless-toolbar-button
            class="transform-button"
            .disabled=${this._imageLoading}
            .activeMode=${'background'}
            .tooltip=${'Image'}
            @click=${() => this._addImages()}
          >
            ${EdgelessImageIcon}
          </edgeless-toolbar-button>
          <edgeless-connector-tool-button
            .edgelessTool=${this.edgelessTool}
            .edgeless=${this.edgeless}
            .setEdgelessTool=${this.setEdgelessTool}
          ></edgeless-connector-tool-button>
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
