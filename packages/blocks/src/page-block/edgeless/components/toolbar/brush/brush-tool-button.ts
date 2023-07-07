import '../../buttons/toolbar-button.js';
import './brush-menu.js';

import { ArrowUpIcon, EdgelessPenIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/store';
import { computePosition, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { GET_DEFAULT_LINE_COLOR } from '../../panel/color-panel.js';
import { getTooltipWithShortcut } from '../../utils.js';
import type { EdgelessBrushMenu } from './brush-menu.js';

interface BrushMenuPopper {
  element: EdgelessBrushMenu;
  dispose: () => void;
}

function createBrushMenuPopper(reference: HTMLElement): BrushMenuPopper {
  const brushMenu = document.createElement('edgeless-brush-menu');
  assertExists(reference.shadowRoot);
  reference.shadowRoot.appendChild(brushMenu);

  computePosition(reference, brushMenu, {
    placement: 'top',
    middleware: [
      offset({
        mainAxis: 10,
      }),
    ],
  }).then(({ x, y }) => {
    Object.assign(brushMenu.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });

  return {
    element: brushMenu,
    dispose: () => {
      brushMenu.remove();
    },
  };
}

@customElement('edgeless-brush-tool-button')
export class EdgelessBrushToolButton extends LitElement {
  static override styles = css`
    :host {
      display: flex;
    }
    .edgeless-brush-button {
      position: relative;
      height: 66px;
      width: 36px;
      overflow-y: hidden;
    }
    #edgeless-pen-icon {
      position: absolute;
      top: 10px;
      left: 0;
      transition: top 0.3s ease-in-out;
    }
    #edgeless-pen-icon:hover {
      top: 2px;
    }
    .arrow-up-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      right: 0px;
      top: 12px;
      width: 14px;
      height: 14px;
      fill: var(--affine-icon-color);
    }
    .arrow-up-icon:hover {
      background: var(--affine-hover-color);
    }
    .pen-color {
      fill: var(--affine-blue-800);
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  private _brushMenu: BrushMenuPopper | null = null;

  private _toggleBrushMenu() {
    if (this._brushMenu) {
      this._brushMenu.dispose();
      this._brushMenu = null;
    } else {
      this._brushMenu = createBrushMenuPopper(this);
      this._brushMenu.element.edgelessTool = this.edgelessTool;
      this._brushMenu.element.edgeless = this.edgeless;
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('edgelessTool')) {
      if (this.edgelessTool.type !== 'brush') {
        this._brushMenu?.dispose();
        this._brushMenu = null;
      }
      if (this._brushMenu) {
        this._brushMenu.element.edgelessTool = this.edgelessTool;
        this._brushMenu.element.edgeless = this.edgeless;
      }
    }
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-toolbar-button
        .tooltip=${getTooltipWithShortcut('Pen', 'P')}
        .active=${type === 'brush'}
        .activeMode=${'background'}
        @click=${() => {
          this.setEdgelessTool({
            type: 'brush',
            lineWidth: 4,
            color: GET_DEFAULT_LINE_COLOR(),
          });
          this._toggleBrushMenu();
        }}
      >
        <div class="edgeless-brush-button">
          ${EdgelessPenIcon}
          <div class="arrow-up-icon">${ArrowUpIcon}</div>
        </div>
      </edgeless-toolbar-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-tool-button': EdgelessBrushToolButton;
  }
}
