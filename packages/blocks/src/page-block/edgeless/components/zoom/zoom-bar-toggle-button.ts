import { assertExists } from '@blocksuite/global/utils';
import { computePosition } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { MoreIcon } from '../../../../_common/icons/index.js';
import { stopPropagation } from '../../../../_common/utils/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { EdgelessZoomToolbar } from './zoom-tool-bar.js';

interface ZoomBarPopper {
  element: EdgelessZoomToolbar;
  dispose: () => void;
}

function createZoomMenuPopper(
  reference: HTMLElement,
  edgeless: EdgelessPageBlockComponent
): ZoomBarPopper {
  const zoomBar = new EdgelessZoomToolbar(edgeless);
  assertExists(reference.shadowRoot);
  zoomBar.layout = 'vertical';
  reference.shadowRoot.appendChild(zoomBar);

  computePosition(reference, zoomBar, {
    placement: 'top',
  }).then(({ x, y }) => {
    Object.assign(zoomBar.style, {
      left: `${x}px`,
      top: `${y - 10}px`,
    });
  });

  return {
    element: zoomBar,
    dispose: () => {
      zoomBar.remove();
    },
  };
}

@customElement('zoom-bar-toggle-button')
export class ZoomBarToggleButton extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
      bottom: 20px;
      left: 12px;
    }
    .toggle-button {
      display: flex;
      position: relative;
    }
    edgeless-zoom-toolbar {
      position: absolute;
      bottom: initial;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @state()
  private _showPopper = false;

  private _zoomBar: ZoomBarPopper | null = null;

  private _closeZoomMenu() {
    this._zoomBar?.dispose();
    this._zoomBar = null;
    this._showPopper = false;
  }

  private _toggleNoteMenu() {
    if (this._zoomBar) {
      this._closeZoomMenu();
    } else {
      this._zoomBar = createZoomMenuPopper(this, this.edgeless);
      this._zoomBar.element.edgeless = this.edgeless;
      this._zoomBar.element.edgeless = this.edgeless;
      this._showPopper = true;
    }
  }

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.edgeless.handleEvent('click', () => {
      if (this._zoomBar && this._showPopper) {
        this._closeZoomMenu();
      }
    });
  }

  override disconnectedCallback() {
    this._zoomBar?.dispose();
    this._zoomBar = null;
    this._showPopper = false;
    super.disconnectedCallback();
  }

  override render() {
    return html`
      <div class="toggle-button" @pointerdown=${stopPropagation}>
        <edgeless-tool-icon-button
          class=${this._showPopper ? 'actived' : 'non-actived'}
          .tooltip=${'Toggle Zoom Tool Bar'}
          .tipPosition=${'right'}
          .active=${this._showPopper}
          .arrow=${false}
          .activeMode=${'background'}
          @click=${() => this._toggleNoteMenu()}
        >
          ${MoreIcon}
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'zoom-bar-toggle-button': ZoomBarToggleButton;
  }
}
