import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  CommonBlockElement,
  convertToList,
  createEvent,
} from '../__internal__';
import { BaseBlockModel, Store } from '@blocksuite/store';
import { GroupBlockModel } from '../group-block';

@customElement('debug-menu')
export class DebugMenu extends LitElement {
  @property()
  store!: Store;

  @property()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentParser!: any;

  @state()
  connected = true;

  @state()
  canUndo = false;

  @state()
  canRedo = false;

  @state()
  _mode: 'page' | 'edgeless' = 'page';

  private _onToggleConnection() {
    if (this.connected === true) {
      this.store.provider?.disconnect();
      this.connected = false;
    } else {
      this.store.provider?.connect();
      this.connected = true;
    }
  }

  private _convertToList(listType: 'bulleted' | 'numbered' | 'todo') {
    const selection = window.getSelection();
    const element = selection?.focusNode?.parentElement as HTMLElement;
    const block = element.closest('[data-block-id]') as CommonBlockElement;
    if (!block) return;

    const store = block.host.store as Store;
    // @ts-ignore
    const model = store.getBlockById(block.model.id) as BaseBlockModel;
    convertToList(this.store, model, listType, '');
  }

  private _onDelete() {
    // TODO delete selected block from menu
  }

  private _onSetParagraphType(type: string) {
    const selection = window.getSelection();
    const element = selection?.focusNode?.parentElement as HTMLElement;
    const block = element.closest('paragraph-block')?.model;
    if (!block) return;

    this.store.captureSync();
    this.store.updateBlock(block, { type });
  }

  private _onSwitchMode() {
    this._mode = this._mode === 'page' ? 'edgeless' : 'page';

    const event = createEvent('affine.switch-mode', this._mode);
    window.dispatchEvent(event);
  }

  private _onAddGroup() {
    const root = this.store.root;
    if (!root) return;
    const pageId = root.id;

    this.store.captureSync();

    const count = root.children.length;
    const xywh = `[0,${count * 60},720,480]`;

    const groupId = this.store.addBlock<GroupBlockModel>(
      { flavour: 'group', xywh },
      pageId
    );
    this.store.addBlock({ flavour: 'paragraph' }, groupId);
  }

  private _onExportHtml() {
    this.contentParser.onExportHtml();
  }

  private _onExportMarkDown() {
    this.contentParser.onExportMarkdown();
  }

  firstUpdated() {
    this.store.signals.historyUpdated.on(() => {
      this.canUndo = this.store.canUndo;
      this.canRedo = this.store.canRedo;
    });
  }

  static styles = css`
    .debug-menu {
      position: fixed;
      top: 0;
      right: 0;
      width: 40px;
    }
    .debug-menu > button {
      margin-left: 2px;
      margin-top: 2px;
      width: 32px;
      height: 24px;
    }
  `;

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
          aria-label="heading-1"
          title="heading-1"
          @click=${() => this._onSetParagraphType('h1')}
        >
          𝐇𝟏
        </button>
        <button
          aria-label="heading-2"
          title="heading-2"
          @click=${() => this._onSetParagraphType('h2')}
        >
          𝐇𝟐
        </button>
        <button
          aria-label="heading-3"
          title="heading-3"
          @click=${() => this._onSetParagraphType('h3')}
        >
          𝐇𝟑
        </button>
        <button
          aria-label="heading-4"
          title="heading-4"
          @click=${() => this._onSetParagraphType('h4')}
        >
          𝐇𝟒
        </button>
        <button
          aria-label="heading-5"
          title="heading-5"
          @click=${() => this._onSetParagraphType('h5')}
        >
          𝐇𝟓
        </button>
        <button
          aria-label="heading-6"
          title="heading-6"
          @click=${() => this._onSetParagraphType('h6')}
        >
          𝐇𝟔
        </button>
        <button
          aria-label="text"
          title="text"
          @click=${() => this._onSetParagraphType('text')}
        >
          𝐓
        </button>
        <button
          aria-label="quote"
          title="quote"
          @click=${() => this._onSetParagraphType('quote')}
        >
          𝑄
        </button>
        <button
          aria-label="convert to todo list"
          title="convert to todo list"
          @click=${() => this._convertToList('todo')}
        >
          ✓
        </button>
        <button
          aria-label="convert to bulleted list"
          title="convert to bulleted list"
          @click=${() => this._convertToList('bulleted')}
        >
          *️⃣
        </button>
        <button
          aria-label="convert to numbered list"
          title="convert to numbered list"
          @click=${() => this._convertToList('numbered')}
        >
          1️⃣
        </button>
        <!--
        <button
          aria-label="delete"
          title="delete"
          disabled
          @click=${this._onDelete}
        >
          ❌
        </button>
        -->
        <button
          aria-label=${this.connected ? 'disconnect' : 'connect'}
          title=${this.connected ? 'disconnect' : 'connect'}
          @click=${this._onToggleConnection}
        >
          ${this.connected ? '🟢' : '🔴'}
        </button>
        <button
          aria-label="switch mode"
          title="switch mode"
          @click=${this._onSwitchMode}
        >
          🔄
        </button>
        <button
          aria-label="add group"
          title="add group"
          @click=${this._onAddGroup}
        >
          🗄
        </button>
        <button
          aria-label="export html"
          title="export html"
          @click=${this._onExportHtml}
        >
          📙
        </button>
        <button
          aria-label="export markdown"
          title="export markdown"
          @click=${this._onExportMarkDown}
        >
          📗
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
