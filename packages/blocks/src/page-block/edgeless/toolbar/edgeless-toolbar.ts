import '../components/tool-icon-button.js';
import './shape/shape-tool-button.js';
import './brush/brush-tool-button.js';
import './connector/connector-tool-button.js';
import './note/note-tool-button.js';
import './image-tool-button.js';
import './eraser-tool-button.js';
import './text-tool-button.js';

import { HandIcon, SelectIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { type EdgelessTool } from '../../../__internal__/index.js';
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

  get edgelessTool() {
    return this.edgeless.edgelessTool;
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.selection.setEdgelessTool(edgelessTool);
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
          style=${this.iconButtonStyles}
          .tooltip=${getTooltipWithShortcut('Select', 'V')}
          .active=${type === 'default'}
          @click=${() => this.setEdgelessTool({ type: 'default' })}
        >
          ${SelectIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          style=${this.iconButtonStyles}
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
        <edgeless-eraser-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-eraser-tool-button>
        <edgeless-text-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-text-tool-button>
        <edgeless-shape-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-shape-tool-button>
        <edgeless-image-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
        ></edgeless-image-tool-button>
        <edgeless-connector-tool-button
          .edgelessTool=${this.edgelessTool}
          .edgeless=${this.edgeless}
          .setEdgelessTool=${this.setEdgelessTool}
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
