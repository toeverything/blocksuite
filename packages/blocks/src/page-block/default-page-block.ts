import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import {
  asyncFocusRichText,
  BLOCK_ID_ATTR,
  hotkeyManager,
  type BlockHost,
} from '@blocksuite/shared';
import type { Store } from '@blocksuite/store';

import type { PageBlockModel } from './page-model';
import {
  SelectionManager,
  MouseManager,
  focusTextEnd,
  BlockChildrenContainer,
} from '../__internal__';
import '../__internal__';

@customElement('default-page-block')
export class DefaultPageBlockComponent extends LitElement implements BlockHost {
  @property()
  store!: Store;

  @state()
  selection!: SelectionManager;

  @state()
  mouse!: MouseManager;

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
    const { undo, redo, selectAll } = hotkeyManager.hotkeysMap;
    const scope = 'page';

    hotkeyManager.addListener(undo, scope, () => this.store.undo());
    hotkeyManager.addListener(redo, scope, () => this.store.redo());
    hotkeyManager.addListener(selectAll, scope, (e: Event) => {
      e.preventDefault();
      const pageChildrenBlock = this.model.children.map(block => block.id);
      this.selection.selectedBlockIds = pageChildrenBlock;
    });
    hotkeyManager.setScope('page');
  }

  private _onKeyDown(e: KeyboardEvent) {
    const hasContent = this._blockTitle.value.length > 0;

    if (e.key === 'Enter' && hasContent) {
      asyncFocusRichText(this.store, this.model.children[0].id);
    }
  }

  private _onTitleInput(e: InputEvent) {
    const { store } = this;

    if (!this.model.id) {
      const title = (e.target as HTMLInputElement).value;
      store.addBlock({ flavour: 'page', title });
      store.addBlock({ flavour: 'paragraph' });
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
      this.selection = new SelectionManager(this.mouseRoot, this.store);
      this.mouse = new MouseManager(this.mouseRoot);
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
    this.mouse.dispose();
    this.selection.dispose();
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this);

    return html`
      <style>
        .affine-default-page-block-title {
          box-sizing: border-box;
          font-size: 32px;
          font-weight: 600;
          outline: none;
          border: 0;
        }
        .affine-default-page-block-title::placeholder {
          color: #ddd;
        }
        .affine-default-page-block-container
          > .affine-block-children-container {
          padding-left: 0;
        }
      </style>
      <selection-rect
        .selection=${this.selection}
        .mouse=${this.mouse}
        .store=${this.store}
      ></selection-rect>
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
