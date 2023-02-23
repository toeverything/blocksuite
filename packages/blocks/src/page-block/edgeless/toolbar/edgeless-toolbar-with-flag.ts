import './edgeless-toolbar.js';

import type { Disposable, Page } from '@blocksuite/store';
import { Signal } from '@blocksuite/store';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { MouseMode } from '../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import type { EdgelessToolBar } from './edgeless-toolbar.js';

@customElement('edgeless-toolbar-with-flag')
export class EdgelessToolbarWithFlag extends LitElement {
  @property()
  edgeless!: EdgelessPageBlockComponent;

  @property()
  mouseRoot!: HTMLElement;

  readonly signals = {
    change: new Signal<MouseMode>(),
  };

  private _toolbar?: EdgelessToolBar;

  @state()
  private _enabled = false;

  private _disposeListenEnableChange?: Disposable;
  private _disposeEventForwarding?: Disposable;

  private _listenEnableChange(page?: Page) {
    if (!page) {
      return;
    }

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
    if (changedProperties.has('edgeless')) {
      if (this.edgeless.page) {
        this._listenEnableChange(this.edgeless.page);
      } else {
        this._disposeListenEnableChange?.dispose();
        this._disposeListenEnableChange = undefined;
        this._enabled = false;
      }
    }

    if (changedProperties.has('_enabled')) {
      if (this._enabled) {
        this._toolbar = document.createElement('edgeless-toolbar');
        this.mouseRoot.appendChild(this._toolbar);

        this._disposeEventForwarding = this._toolbar.signals.change.on(v => {
          this.signals.change.emit(v);
        });
      } else {
        this._disposeEventForwarding?.dispose();
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

    this.signals.change.dispose();

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
