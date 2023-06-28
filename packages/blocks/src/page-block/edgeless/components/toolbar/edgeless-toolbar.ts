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
import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { stopPropagation } from '../../../../__internal__/utils/event.js';
import { uploadImageFromLocal } from '../../../../__internal__/utils/filesys.js';
import { Point } from '../../../../__internal__/utils/rect.js';
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
      padding: 4px 10px;
      height: 64px;
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
    .eraser-button {
      position: relative;
      height: 72px;
      width: 40px;
      overflow-y: hidden;
    }
    #edgeless-eraser-icon {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      transition: top 0.3s ease-in-out;
    }
    #edgeless-eraser-icon:hover {
      top: 6px;
    }
    .edgeless-right-part {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;
    }
    .transform-button svg {
      transition: 0.3s ease-in-out;
    }
    .transform-button:hover svg {
      transform: translateY(-8px);
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

  private async _addImage() {
    this._imageLoading = true;
    const options = {
      width: 0,
      height: 0,
      offsetX: 0,
      offsetY: 0,
    };

    const models = await uploadImageFromLocal(this.edgeless.page, realSize =>
      Object.assign(options, realSize)
    );

    const { left, width, top, height } =
      this.edgeless.pageBlockContainer.getBoundingClientRect();

    if (options.width && options.height) {
      const s = width / height;
      const sh = height > 100 ? height - 100 : height;
      const p = options.width / options.height;
      if (s >= 1) {
        options.height = Math.min(options.height, sh);
        options.width = p * options.height;
      } else {
        const sw = sh * s;
        options.width = Math.min(options.width, sw);
        options.height = options.width / p;
      }
    }

    const { zoom } = this.edgeless.surface.viewport;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    let x = 0;
    let y = 0;
    if (zoom > 1) {
      x = centerX - options.width / 2;
      y = centerY - options.height / 2;
      options.width /= zoom;
      options.height /= zoom;
    } else {
      x = centerX - (options.width * zoom) / 2;
      y = centerY - (options.height * zoom) / 2;
    }

    const { noteId } = this.edgeless.addNewNote(
      models,
      new Point(x, y),
      options
    );
    const note = this.edgeless.notes.find(note => note.id === noteId);
    assertExists(note);

    this.edgeless.selection.switchToDefaultMode({
      selected: [note],
      active: false,
    });

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
            @click=${() => this._addImage()}
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
