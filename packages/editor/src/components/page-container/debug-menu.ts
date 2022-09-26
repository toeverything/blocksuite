import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PageContainer } from './page-container';

const params = new URLSearchParams(location.search);
const initType = params.get('init') || 'default';

@customElement('debug-menu')
export class DebugMenu extends LitElement {
  @property()
  page!: PageContainer;

  @state()
  connected = true;

  @state()
  canUndo = false;

  @state()
  canRedo = false;

  @state()
  canDelete = false;

  static styles = css`
    .debug-menu {
      position: fixed;
      left: 0;
      top: 0;
      width: 40px;
    }
    .debug-menu > button {
      margin-left: 5px;
      margin-top: 5px;
    }
  `;

  get store() {
    return this.page.store;
  }

  private _onToggleConnection() {
    if (this.connected === true) {
      this.store.provider.disconnect();
      this.connected = false;
    } else {
      this.store.provider.connect();
      this.connected = true;
    }
  }

  private _onAddList() {
    if (!this.page.model) {
      this.store.addBlock({ flavour: 'page' });
      this.store.addBlock({ flavour: 'paragraph' });
    }

    this.store.addBlock({ flavour: 'list' });
  }

  private _onDelete() {
    this.page.selection.selectionInfo.selectedNodesIds?.forEach(id => {
      this.store.deleteBlockById(id);
    });
  }

  private _handleDebugInit() {
    if (initType === 'list') {
      this.store.addBlock({ flavour: 'page' });
      for (let i = 0; i < 3; i++) {
        this.store.addBlock({ flavour: 'list' });
      }
    }
  }

  firstUpdated() {
    this.store.slots.historyUpdated.on(() => {
      this.canUndo = this.store.canUndo;
      this.canRedo = this.store.canRedo;
    });

    this.page.selection.onSelectionChange(selectionInfo => {
      this.canDelete = selectionInfo?.selectedNodesIds?.length !== undefined;
    });

    requestAnimationFrame(() => this._handleDebugInit());
  }

  render() {
    return html`
      <div class="debug-menu">
        <button
          aria-label="undo"
          title="undo"
          .disabled=${!this.canUndo}
          @click=${() => this.store.undo()}
        >
          ⬅️
        </button>
        <button
          aria-label="redo"
          title="redo"
          .disabled=${!this.canRedo}
          @click=${() => this.store.redo()}
        >
          ➡️
        </button>
        <button
          aria-label=${this.connected ? 'disconnect' : 'connect'}
          title=${this.connected ? 'disconnect' : 'connect'}
          @click=${this._onToggleConnection}
        >
          ${this.connected ? '🟢' : '🔴'}
        </button>
        <button
          aria-label="add list"
          title="add list"
          @click=${this._onAddList}
        >
          *️⃣
        </button>
        <button
          aria-label="delete"
          title="delete"
          .disabled=${!this.canDelete}
          @click=${this._onDelete}
        >
          ❌
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
