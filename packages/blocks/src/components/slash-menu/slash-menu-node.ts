import type { BaseBlockModel } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../__internal__/rich-text/rich-text.js';
import { getRichTextByModel } from '../../__internal__/utils/index.js';
import { menuGroups, SlashItem } from './config.js';
import { styles } from './styles.js';

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
  private _activeItemIndex = 0;

  @state()
  private _filterItems = menuGroups.flatMap(group => group.items);

  @state()
  private _hide = false;

  private _searchString = '';

  // Just a temp variable
  private _richText?: RichText;

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this._escapeListener);
    window.addEventListener('mousedown', this._clickAwayListener);

    const richText = getRichTextByModel(this.model);
    if (!richText) {
      console.warn(
        'Slash Menu may not work properly! No rich text found for model',
        this.model
      );
      return;
    }
    this._richText = richText;
    richText.addEventListener('keydown', this._keyDownListener, {
      // Workaround: Use capture to prevent the event from triggering the keyboard bindings action
      capture: true,
    });
    richText.addEventListener('focusout', this._clickAwayListener);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._escapeListener);
    this._richText?.removeEventListener('keydown', this._keyDownListener, {
      capture: true,
    });
    this._richText?.removeEventListener('focusout', this._clickAwayListener);
  }

  // Handle click outside
  private _clickAwayListener = (e: Event) => {
    // if (e.target === this) {
    //   return;
    // }
    if (!this._hide) {
      return;
    }
    // If the slash menu is hidden, click anywhere will close the slash menu
    this.abortController.abort();
  };

  /**
   * Handle arrow key
   *
   * The slash menu will be closed in the following keyboard cases:
   * - Press the space key
   * - Press the backspace key and the search string is empty
   * - Press the escape key (handled by {@link _escapeListener})
   * - When the search item is empty, the slash menu will be hidden temporarily,
   *   and if the following key is not the backspace key, the slash menu will be closed
   */
  private _keyDownListener = (e: KeyboardEvent) => {
    if (this._hide) {
      if (e.key !== 'Backspace') {
        this.abortController.abort();
        return;
      }
      this._searchString = this._searchString.slice(0, -1);
      this._filterItems = this._updateItem();
      this._hide = false;
      return;
    }
    if (e.key === ' ') {
      this.abortController.abort();
      return;
    }
    if (e.key === 'Backspace') {
      if (!this._searchString.length) {
        this.abortController.abort();
      }
      this._searchString = this._searchString.slice(0, -1);
      this._filterItems = this._updateItem();
      return;
    }
    if (e.key.length === 1) {
      this._searchString += e.key;
      this._filterItems = this._updateItem();
      if (!this._filterItems.length) {
        this._hide = true;
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
    const configLen = this._filterItems.length;
    switch (e.key) {
      case 'Enter': {
        this._handleItemClick(this._activeItemIndex);
        break;
      }
      case 'ArrowUp': {
        this._activeItemIndex =
          (this._activeItemIndex - 1 + configLen) % configLen;
        this._queryItemEle(
          this._filterItems[this._activeItemIndex]
        )?.scrollIntoView(false);
        break;
      }
      case 'ArrowDown': {
        this._activeItemIndex = (this._activeItemIndex + 1) % configLen;
        this._queryItemEle(
          this._filterItems[this._activeItemIndex]
        )?.scrollIntoView(false);
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
    this.abortController.abort(this._searchString);
    const { action } = this._filterItems[index];
    action({ page: this.model.page, model: this.model });
  }

  private _updateItem(): SlashItem[] {
    this._activeItemIndex = 0;
    const searchStr = this._searchString.toLowerCase();
    if (!searchStr) {
      return menuGroups.flatMap(group => group.items);
    }
    return menuGroups
      .flatMap(group => group.items)
      .filter(({ name }) => {
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

  private _queryItemEle(item: SlashItem) {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) {
      return null;
    }
    return shadowRoot.querySelector(`format-bar-button[text="${item.name}"]`);
  }

  private _categoryTemplate() {
    const handleClickCategory = (group: {
      name: string;
      items: SlashItem[];
    }) => {
      const menuGroup = menuGroups.find(g => g.name === group.name);
      if (!menuGroup) return;
      const item = menuGroup.items[0];
      this._queryItemEle(item)?.scrollIntoView(true);
      this._activeItemIndex = this._filterItems.findIndex(
        i => i.name === item.name
      );
    };

    const activeCategory = menuGroups.find(group =>
      group.items.some(
        item => item.name === this._filterItems[this._activeItemIndex].name
      )
    );

    return html`<div
      class="slash-category"
      style="${this._searchString.length
        ? 'max-width: 0; padding: 0; margin: 0;'
        : ''}"
    >
      ${menuGroups.map(
        group =>
          html`<div
            class="slash-category-name ${activeCategory?.name === group.name
              ? 'slash-active-category'
              : ''}"
            @click=${() => handleClickCategory(group)}
          >
            ${group.name}
          </div>`
      )}
    </div>`;
  }

  override render() {
    if (this._hide) {
      return html``;
    }
    const containerStyles = styleMap({
      left: this.left,
      top: this.top,
    });

    const slashMenuStyles = styleMap({
      top: this.position === 'bottom' ? '100%' : null,
      bottom: this.position !== 'bottom' ? '100%' : null,
      maxHeight: this.maxHeight,
    });

    const btnItems = this._filterItems.map(
      ({ name, icon, divider }, index) => html`<div
          class="slash-item-divider"
          ?hidden=${!divider || !!this._searchString.length}
        ></div>
        <format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          ?hover=${this._activeItemIndex === index}
          text="${name}"
          data-testid="${name}"
          @mouseover=${() => {
            this._activeItemIndex = index;
          }}
          @click=${() => {
            this._handleItemClick(index);
          }}
        >
          ${icon}
        </format-bar-button>`
    );

    return html`<div class="slash-menu-container" style="${containerStyles}">
      <div
        class="overlay-mask"
        @click="${() => this.abortController.abort()}"
      ></div>
      <div class="slash-menu" style="${slashMenuStyles}">
        ${this._categoryTemplate()}
        <div class="slash-item-container">${btnItems}</div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'slash-menu': SlashMenu;
  }
}
