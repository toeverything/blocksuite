import '../components/tool-icon-button.js';
import './shape-tool/shape-tool-button.js';
import './brush-tool/brush-tool-button.js';
import './connector-tool/connector-tool-button.js';
import './note-tool/note-tool-button.js';
import './image-tool-button.js';
import './eraser-tool-button.js';

import { HandIcon, SelectIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { type MouseMode } from '../../../__internal__/index.js';
import { getTooltipWithShortcut } from '../components/utils.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { stopPropagation } from '../utils.js';

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
      padding: 0 20px;
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

    .zoom-percent {
      display: block;
      box-sizing: border-box;
      width: 48px;
      height: 32px;
      line-height: 22px;
      padding: 5px;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      cursor: pointer;
      color: var(--affine-icon-color);
    }

    .zoom-percent:hover {
      color: var(--affine-primary-color);
      background-color: var(--affine-hover-color);
    }
  `;

  edgeless: EdgelessPageBlockComponent;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  get mouseMode() {
    return this.edgeless.mouseMode;
  }

  setMouseMode = (mouseMode: MouseMode) => {
    this.edgeless.selection.setMouseMode(mouseMode);
  };

  private iconButtonStyles = `
    --hover-color: var(--affine-hover-color);
    --active-color: var(--affine-primary-color);
  `;

  override firstUpdated() {
    const {
      _disposables,
      edgeless: { slots },
    } = this;
    _disposables.add(
      slots.mouseModeUpdated.on(() => {
        this._trySaveBrushStateLocalRecord();
        this.requestUpdate();
      })
    );
    _disposables.add(slots.viewportUpdated.on(() => this.requestUpdate()));
  }

  private _trySaveBrushStateLocalRecord = () => {
    const mouseMode = this.edgeless.selection.mouseMode;
    if (mouseMode.type === 'brush') {
      sessionStorage.setItem(
        'blocksuite:' + this.edgeless.page.id + ':edgelessBrush',
        JSON.stringify({
          color: mouseMode.color,
          lineWidth: mouseMode.lineWidth,
        })
      );
    }
  };

  override render() {
    const { type } = this.mouseMode;

    return html`
      <div
        class="edgeless-toolbar-container"
        @dblclick=${stopPropagation}
        @mousedown=${stopPropagation}
        @mouseup=${stopPropagation}
        @pointerdown=${stopPropagation}
      >
        <edgeless-tool-icon-button
          style=${this.iconButtonStyles}
          .tooltip=${getTooltipWithShortcut('Select', 'V')}
          .active=${type === 'default'}
          @click=${() => this.setMouseMode({ type: 'default' })}
        >
          ${SelectIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          style=${this.iconButtonStyles}
          .tooltip=${getTooltipWithShortcut('Hand', 'H')}
          .active=${type === 'pan'}
          @click=${() => this.setMouseMode({ type: 'pan', panning: false })}
        >
          ${HandIcon}
        </edgeless-tool-icon-button>
        <div class="short-divider"></div>
        <edgeless-note-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-note-tool-button>
        <div class="full-divider"></div>
        <edgeless-brush-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-brush-tool-button>
        <edgeless-eraser-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-eraser-tool-button>
        <edgeless-text-icon-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-text-icon-button>
        <edgeless-shape-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-shape-tool-button>
        <edgeless-image-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        >
        </edgeless-image-tool-button>
        <edgeless-connector-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-connector-tool-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar': EdgelessToolbar;
  }
}
