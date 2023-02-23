import './edgeless-toolbar.js';

import type { Disposable, Page } from '@blocksuite/store';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { MouseMode } from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type { EdgelessToolBar } from './edgeless-toolbar.js';

@customElement('edgeless-toolbar-with-flag')
export class EdgelessToolbarWithFlag extends LitElement {
  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  @property()
  mouseRoot!: HTMLElement;

  private _toolbar?: EdgelessToolBar;

  @state()
  private _enabled = false;

  private _disposeListenEnableChange?: Disposable;
  private _disposeEventForwarding?: Disposable;

  private _listenEnableChange(page: Page) {
    this._enabled =
      page.awarenessStore.getFlag('enable_edgeless_toolbar') ?? false;

    const clientID = page.doc.clientID;

    this._disposeListenEnableChange =
      page.awarenessStore.signals.update.subscribe(
        msg => msg.state?.flags.enable_edgeless_toolbar,
        enable => {
          this._enabled = enable ?? false;
        },
        {
          filter: msg => msg.id === clientID,
        }
      );
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('_enabled')) {
      if (this._enabled) {
        this._toolbar = document.createElement('edgeless-toolbar');
        this._toolbar.mouseMode = this.mouseMode;
        this._toolbar.edgeless = this.edgeless;
        this.mouseRoot.appendChild(this._toolbar);
      } else {
        this._disposeEventForwarding?.dispose();
      }
    }

    if (changedProperties.has('mouseMode')) {
      if (this._toolbar) {
        this._toolbar.mouseMode = this.mouseMode;
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this._listenEnableChange(this.edgeless.page);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._toolbar?.remove();

    this._disposeListenEnableChange?.dispose();

    this._disposeEventForwarding?.dispose();
  }

  render() {
    return html`${nothing}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar-with-flag': EdgelessToolbarWithFlag;
  }
}
