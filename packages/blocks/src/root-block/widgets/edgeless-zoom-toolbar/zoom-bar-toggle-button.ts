import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { computePosition } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { MoreIcon } from '../../../_common/icons/edgeless.js';
import { stopPropagation } from '../../../_common/utils/event.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { EdgelessZoomToolbar } from './zoom-toolbar.js';

interface ZoomBarPopper {
  element: EdgelessZoomToolbar;
  dispose: () => void;
}

function createZoomMenuPopper(
  reference: HTMLElement,
  edgeless: EdgelessRootBlockComponent
): ZoomBarPopper {
  const zoomBar = new EdgelessZoomToolbar(edgeless);
  assertExists(reference.shadowRoot);
  zoomBar.layout = 'vertical';
  reference.shadowRoot.append(zoomBar);

  computePosition(reference, zoomBar, {
    placement: 'top',
  })
    .then(({ x, y }) => {
      Object.assign(zoomBar.style, {
        left: `${x}px`,
        top: `${y - 10}px`,
      });
    })
    .catch(console.error);

  return {
    element: zoomBar,
    dispose: () => {
      zoomBar.remove();
    },
  };
}

@customElement('zoom-bar-toggle-button')
export class ZoomBarToggleButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
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
  edgeless!: EdgelessRootBlockComponent;

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

  override firstUpdated() {
    const { disposables } = this;
    disposables.add(
      this.edgeless.slots.readonlyUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    if (this.edgeless.doc.readonly) {
      return nothing;
    }

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
