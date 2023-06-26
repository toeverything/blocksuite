import '../../components/tool-icon-button.js';
import './brush-menu.js';

import { EdgelessPenIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/store';
import { computePosition, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../__internal__/index.js';
import { GET_DEFAULT_LINE_COLOR } from '../../components/color-panel.js';
import { getTooltipWithShortcut } from '../../components/utils.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
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

    edgeless-tool-icon-button svg {
      transition: 0.2s ease-in-out;
    }

    edgeless-tool-icon-button:hover svg {
      transform: translateY(-8px);
    }
  `;

  @property({ attribute: false })
  edgelessTool!: EdgelessTool;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  setEdgelessTool!: (edgelessTool: EdgelessTool) => void;

  private iconButtonStyles = `
    --hover-color: transparent;
    --active-color: var(--affine-primary-color);
  `;

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

  override disconnectedCallback() {
    this._brushMenu?.dispose();
    this._brushMenu = null;
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-tool-icon-button
        style=${this.iconButtonStyles}
        .tooltip=${getTooltipWithShortcut('Pen', 'P')}
        .active=${type === 'brush'}
        @click=${() => {
          this.setEdgelessTool({
            type: 'brush',
            lineWidth: 4,
            color: GET_DEFAULT_LINE_COLOR(),
          });
          this._toggleBrushMenu();
        }}
      >
        ${EdgelessPenIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-tool-button': EdgelessBrushToolButton;
  }
}
