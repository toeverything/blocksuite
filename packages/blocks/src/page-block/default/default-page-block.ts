import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { Store } from '@blocksuite/store';

import type { PageBlockModel } from '..';
import {
  asyncFocusRichText,
  BLOCK_ID_ATTR,
  hotkeyManager,
  type BlockHost,
  BlockChildrenContainer,
  SelectionPosition,
} from '../../__internal__';
import style from './style.css';

// https://stackoverflow.com/a/2345915
export function focusTextEnd(input: HTMLInputElement) {
  const current = input.value;
  input.focus();
  input.value = '';
  input.value = current;
}

export class SelectionManager {
  lastSelectionPosition: SelectionPosition = 'start';
}

@customElement('default-page-block')
export class DefaultPageBlockComponent extends LitElement implements BlockHost {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property()
  store!: Store;

  selection = new SelectionManager();

  @property()
  mouseRoot!: HTMLElement;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  @query('.affine-default-page-block-title')
  _blockTitle!: HTMLInputElement;

  private _bindHotkeys() {
    const {
      undo,
      redo,
      selectAll,
      deleteKey,
      expandSelectionUp,
      expandSelectionDown,
    } = hotkeyManager.hotkeysMap;
    const scope = 'page';
    hotkeyManager.addListener(undo, scope, (e: Event) => {
      e.preventDefault();
      this.store.undo();
    });
    hotkeyManager.addListener(redo, scope, (e: Event) => {
      e.preventDefault();
      this.store.redo();
    });
    hotkeyManager.addListener(selectAll, scope, (e: Event) => {
      e.preventDefault();
      // TODO select all blocks
    });
    hotkeyManager.addListener(deleteKey, scope, (e: Event) => {
      e.preventDefault();
      // TODO delte selected blocks
    });
    hotkeyManager.addListener(expandSelectionUp, scope, (e: Event) => {
      // TODO expand selection up
    });
    hotkeyManager.addListener(expandSelectionDown, scope, (e: Event) => {
      // TODO expand selection down
    });
    hotkeyManager.setScope('page');
  }

  private _removeHotkeys() {
    const { undo, redo, selectAll, deleteKey } = hotkeyManager.hotkeysMap;
    hotkeyManager.removeListener([undo, redo, selectAll, deleteKey], 'page');
  }

  private _onKeyDown(e: KeyboardEvent) {
    const hasContent = this._blockTitle.value.length > 0;

    if (e.key === 'Enter' && hasContent) {
      const defaultGroup = this.model.children[0];
      const firstParagraph = defaultGroup.children[0];
      asyncFocusRichText(this.store, firstParagraph.id);
    }
  }

  private _onTitleInput(e: InputEvent) {
    const { store } = this;

    if (!this.model.id) {
      const title = (e.target as HTMLInputElement).value;
      const pageId = store.addBlock({ flavour: 'page', title });
      const groupId = store.addBlock({ flavour: 'group' }, pageId);
      store.addBlock({ flavour: 'paragraph' }, groupId);
      return;
    }

    const title = (e.target as HTMLInputElement).value;
    store.updateBlock(this.model, { title });
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this._bindHotkeys();

    this.model.propsUpdated.on(() => {
      if (this.model.title !== this._blockTitle.value) {
        this._blockTitle.value = this.model.title || '';
        this.requestUpdate();
      }
    });

    focusTextEnd(this._blockTitle);

    // fix hotkey error when focus on title
    this._blockTitle.addEventListener('blur', () => {
      hotkeyManager.setScope('page');
    });
    this._blockTitle.addEventListener('focus', () => {
      hotkeyManager.setScope('all');
    });
  }

  disconnectedCallback() {
    this._removeHotkeys();
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this);

    return html`
      <div class="affine-default-page-block-container">
        <div class="affine-default-page-block-title-container">
          <input
            placeholder="Title"
            class="affine-default-page-block-title"
            value=${this.model.title}
            @keydown=${this._onKeyDown}
            @input=${this._onTitleInput}
          />
        </div>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-page-block': DefaultPageBlockComponent;
  }
}
