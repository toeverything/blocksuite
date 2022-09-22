import { LitElement, html } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import type { PageContainer } from './page-container';

const params = new URLSearchParams(location.search);
const initType = params.get('init') || 'default';

@customElement('debug-menu')
export class DebugMenu extends LitElement {
  @property()
  page!: PageContainer;

  @state()
  connectionBtnText = 'Disconnect';

  @state()
  canUndo = false;

  @state()
  canRedo = false;

  get store() {
    return this.page.store;
  }

  private _onToggleConnection() {
    if (this.connectionBtnText === 'Disconnect') {
      this.store.provider.disconnect();
      this.connectionBtnText = 'Connect';
    } else {
      this.store.provider.connect();
      this.connectionBtnText = 'Disconnect';
    }
  }

  private _onAddList() {
    if (!this.page.model) {
      this.store.addBlock({
        flavour: 'page',
        children: [],
      });
      this.store.addBlock({
        flavour: 'text',
        children: [],
      });
    }

    this.store.addBlock({
      flavour: 'list',
      children: [],
    });
  }

  private _handleDebugInit() {
    if (initType === 'list') {
      this.store.addBlock({
        flavour: 'page',
        children: [],
      });
      for (let i = 0; i < 3; i++) {
        this.store.addBlock({
          flavour: 'list',
          children: [],
        });
      }
    }
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.store.slots.historyUpdated.on(() => {
      this.canUndo = this.store.canUndo;
      this.canRedo = this.store.canRedo;
    });

    requestAnimationFrame(() => this._handleDebugInit());
  }

  render() {
    return html`
      <div style="margin-bottom: 10px">
        <button .disabled=${!this.canUndo} @click=${() => this.store.undo()}>
          Undo
        </button>
        <button .disabled=${!this.canRedo} @click=${() => this.store.redo()}>
          Redo
        </button>
        <button @click=${this._onToggleConnection}>
          ${this.connectionBtnText}
        </button>
        <button @click=${this._onAddList}>Add List</button>
        <!-- TODO init model delete -->
        <button
          .disabled=${this.page.selectionInfo.type !== 'Block' ||
          !this.page.selectionInfo?.selectedNodesIds.length}
        >
          Delete
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'debug-menu': DebugMenu;
  }
}
