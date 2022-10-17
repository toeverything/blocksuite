import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { Store } from '@blocksuite/store';

import type { PageBlockModel } from '..';
import {
  type BlockHost,
  asyncFocusRichText,
  BLOCK_ID_ATTR,
  hotkey,
  BlockChildrenContainer,
  SelectionPosition,
  HOTKEYS,
  handleBackspace,
  handleFormat,
} from '../../__internal__';
import { DefaultMouseManager } from './mouse-manager';
import style from './style.css';

// https://stackoverflow.com/a/2345915
function focusTextEnd(input: HTMLInputElement) {
  const current = input.value;
  input.focus();
  input.value = '';
  input.value = current;
}

@customElement('default-page-block')
export class DefaultPageBlockComponent extends LitElement implements BlockHost {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property()
  store!: Store;

  mouse!: DefaultMouseManager;

  lastSelectionPosition: SelectionPosition = 'start';

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
    const { store } = this;

    hotkey.addListener(HOTKEYS.UNDO, () => store.undo());
    hotkey.addListener(HOTKEYS.REDO, () => store.redo());

    hotkey.addListener(HOTKEYS.BACKSPACE, e => {
      handleBackspace(store, e);
    });
    hotkey.addListener(HOTKEYS.INLINE_CODE, e => {
      handleFormat(store, e, 'code');
    });
    hotkey.addListener(HOTKEYS.STRIKE, e => {
      handleFormat(store, e, 'strike');
    });
    hotkey.addListener(HOTKEYS.SHIFT_UP, e => {
      // TODO expand selection up
    });
    hotkey.addListener(HOTKEYS.SHIFT_DOWN, e => {
      // TODO expand selection down
    });
  }

  private _removeHotkeys() {
    hotkey.removeListener([
      HOTKEYS.UNDO,
      HOTKEYS.REDO,
      HOTKEYS.BACKSPACE,
      HOTKEYS.INLINE_CODE,
      HOTKEYS.STRIKE,
      HOTKEYS.SHIFT_UP,
      HOTKEYS.SHIFT_DOWN,
    ]);
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

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseRoot') && changedProperties.has('store')) {
      this.mouse = new DefaultMouseManager(this.store, this.mouseRoot);
    }
    super.update(changedProperties);
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
  }

  disconnectedCallback() {
    this._removeHotkeys();
    this.mouse.dispose();
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
