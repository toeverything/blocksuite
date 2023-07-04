import { MoreIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/store';
import { computePosition } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { stopPropagation } from '../../../../__internal__/utils/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { EdgelessZoomToolbar } from './zoom-tool-bar.js';

interface ZoomBarPopper {
  element: EdgelessZoomToolbar;
  dispose: () => void;
}

function createNoteMenuPopper(
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
      top: `${y}px`,
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
      bottom: 48px;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @state()
  private _popperShow = false;

  private _zoomBar: ZoomBarPopper | null = null;

  private _toggleNoteMenu() {
    if (this._zoomBar) {
      this._zoomBar.dispose();
      this._zoomBar = null;
      this._popperShow = false;
    } else {
      this._zoomBar = createNoteMenuPopper(this, this.edgeless);
      this._zoomBar.element.edgeless = this.edgeless;
      this._zoomBar.element.edgeless = this.edgeless;
      this._popperShow = true;
    }
  }

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  override disconnectedCallback() {
    this._zoomBar?.dispose();
    this._zoomBar = null;
    this._popperShow = false;
    super.disconnectedCallback();
  }

  override render() {
    return html`
      <div class="toggle-button" @pointerdown=${stopPropagation}>
        <edgeless-tool-icon-button
          class=${this._popperShow ? 'actived' : 'non-actived'}
          .tooltip=${'Toggle Zoom Tool Bar'}
          .tipPosition=${'right'}
          .active=${this._popperShow}
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
