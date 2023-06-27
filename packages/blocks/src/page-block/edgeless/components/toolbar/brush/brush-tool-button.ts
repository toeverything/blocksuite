import '../../buttons/tool-icon-button.js';
import './brush-menu.js';

import { EdgelessPenIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/store';
import { computePosition, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

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
    edgeless-tool-icon-button.icon-container:hover {
      background: var(--affine-background-overlay-panel-color);
    }
    edgeless-tool-icon-button svg {
      transform: translateY(3px);
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

  @query('.edgeless-pen-icon')
  private _penIcon!: SVGElement;

  private iconButtonStyles = `
    --hover-color: transparent;
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

  private _handleMouseEnter() {
    this._penIcon.setAttribute('viewBox', '0 0 22 60');
  }

  private _handleMouseLeave() {
    this._penIcon.setAttribute('viewBox', '0 0 22 52');
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

  override connectedCallback() {
    super.connectedCallback();
    const observer = new MutationObserver(() => {
      // add mouse hover event to pen icon
      this._penIcon.addEventListener(
        'mouseenter',
        this._handleMouseEnter.bind(this)
      );
      this._penIcon.addEventListener(
        'mouseleave',
        this._handleMouseLeave.bind(this)
      );
      observer.disconnect();
    });

    if (!this.shadowRoot) return;
    observer.observe(this.shadowRoot, { childList: true });
  }

  override disconnectedCallback() {
    this._brushMenu?.dispose();
    this._brushMenu = null;
    this._penIcon.removeEventListener(
      'mouseenter',
      this._handleMouseEnter.bind(this)
    );
    this._penIcon.removeEventListener(
      'mouseleave',
      this._handleMouseLeave.bind(this)
    );
    super.disconnectedCallback();
  }

  override render() {
    const type = this.edgelessTool?.type;

    return html`
      <edgeless-tool-icon-button
        style=${this.iconButtonStyles}
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
