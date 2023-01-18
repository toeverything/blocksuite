import { paragraphConfig } from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { updateSelectedTextType } from '../../page-block/utils/index.js';
import type { RichText } from '../../__internal__/rich-text/rich-text.js';
import { getRichTextByModel } from '../../__internal__/utils/index.js';

const styles = css`
  .overlay-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--affine-z-index-popover);
  }

  .slash-menu-container {
    position: fixed;
    z-index: var(--affine-z-index-popover);
  }

  .slash-menu {
    font-size: var(--affine-font-sm);
    position: absolute;
    min-width: 173px;
    padding: 8px 4px;
    overflow-y: auto;

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0px 10px 10px 10px;
    z-index: var(--affine-z-index-popover);
  }
`;

@customElement('slash-menu')
export class SlashMenu extends LitElement {
  static styles = styles;

  @property()
  left: string | null = null;

  @property()
  top: string | null = null;

  @property()
  maxHeight: string | null = null;

  @property()
  position: 'top' | 'bottom' = 'bottom';

  @property()
  model!: BaseBlockModel;

  @property()
  abortController = new AbortController();

  @query('.slash-menu')
  slashMenuElement!: HTMLElement;

  @state()
  private activeItemIndex = 0;

  @state()
  private filterItems: typeof paragraphConfig = paragraphConfig;

  private searchString = '';

  // Just a temp variable
  private richText?: RichText;

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this._escapeListener);

    const richText = getRichTextByModel(this.model);
    if (!richText) {
      console.warn(
        'Slash Menu may not work properly! No rich text found for model',
        this.model
      );
      return;
    }
    richText.addEventListener('keydown', this._keyDownListener, {
      // Workaround Use capture to prevent the event from triggering the keyboard bindings action
      capture: true,
    });
    this.richText = richText;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._escapeListener);
    this.richText?.removeEventListener('keydown', this._keyDownListener, {
      capture: true,
    });
  }

  /**
   * Handle arrow key
   */
  private _keyDownListener = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      this.abortController.abort();
      return;
    }
    if (e.key === 'Backspace') {
      if (!this.searchString.length) {
        this.abortController.abort();
      }
      this.searchString = this.searchString.slice(0, -1);
      this.filterItems = this._updateItem();
      return;
    }
    if (e.key.length === 1) {
      this.searchString += e.key;
      this.filterItems = this._updateItem();
      if (!this.filterItems.length) {
        this.abortController.abort();
      }
      return;
    }

    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(
        e.key
      )
    ) {
      return;
    }
    const configLen = this.filterItems.length;
    switch (e.key) {
      case 'Enter': {
        this._handleItemClick(this.activeItemIndex);
        break;
      }
      case 'ArrowUp': {
        this.activeItemIndex =
          (this.activeItemIndex - 1 + configLen) % configLen;
        break;
      }
      case 'ArrowDown': {
        this.activeItemIndex = (this.activeItemIndex + 1) % configLen;
        break;
      }
      case 'ArrowRight':
      case 'ArrowLeft':
        this.abortController.abort();
        return;
      default:
        throw new Error(`Unknown key: ${e.key}`);
    }
    // prevent arrow key from moving cursor
    e.preventDefault();
    // prevent the event from triggering the keyboard bindings action
    e.stopPropagation();
  };

  /**
   * Handle press esc
   */
  private _escapeListener = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') {
      return;
    }
    this.abortController.abort();
    window.removeEventListener('keyup', this._escapeListener);
  };

  private _handleItemClick(index: number) {
    // Need to remove the search string
    this.abortController.abort(this.searchString);
    const { flavour, type } = this.filterItems[index];
    updateSelectedTextType(flavour, type, this.model.page);
  }

  private _updateItem() {
    this.activeItemIndex = 0;
    const searchStr = this.searchString.toLowerCase();
    if (!searchStr) {
      return paragraphConfig;
    }
    return paragraphConfig.filter(({ name }) => {
      if (
        name
          .trim()
          .toLowerCase()
          .split('')
          .filter(char => /[A-Za-z0-9]/.test(char))
          .join('')
          .includes(searchStr)
      ) {
        return true;
      }
      return false;
    });
  }

  override render() {
    const containerStyles = styleMap({
      left: this.left,
      top: this.top,
    });

    const slashMenuStyles = styleMap({
      top: this.position === 'bottom' ? '100%' : null,
      bottom: this.position !== 'bottom' ? '100%' : null,
      maxHeight: this.maxHeight,
    });

    return html`<div class="slash-menu-container" style="${containerStyles}">
      <div
        class="overlay-mask"
        @click="${() => this.abortController.abort()}"
      ></div>
      <div class="slash-menu" style="${slashMenuStyles}">
        ${this.filterItems.map(
          ({ type, name, icon }, index) => html`<format-bar-button
            width="100%"
            style="padding-left: 12px; justify-content: flex-start;"
            ?hover=${this.activeItemIndex === index}
            text="${name}"
            data-testid="${type}"
            @click=${() => {
              this._handleItemClick(index);
            }}
          >
            ${icon}
          </format-bar-button>`
        )}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'slash-menu': SlashMenu;
  }
}
