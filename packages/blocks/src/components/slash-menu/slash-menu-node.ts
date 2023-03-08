import type { BaseBlockModel } from '@blocksuite/store';
import { DisposableGroup } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getRichTextByModel } from '../../__internal__/utils/index.js';
import { menuGroups, SlashItem } from './config.js';
import { styles } from './styles.js';

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@customElement('slash-menu')
export class SlashMenu extends LitElement {
  static styles = styles;

  @property()
  left: string | null = null;

  @property()
  top: string | null = null;

  @property()
  maxHeight: number | null = null;

  @property()
  position: 'top' | 'bottom' = 'bottom';

  @property()
  model!: BaseBlockModel;

  @property()
  abortController = new AbortController();

  @query('.slash-menu')
  slashMenuElement!: HTMLElement;

  @state()
  private _leftPanelActivated = false;

  @state()
  private _activatedItemIndex = 0;

  @state()
  private _filterItems = menuGroups.flatMap(group => group.items);

  @state()
  private _hide = false;

  /**
   * Does not include the slash character
   */
  private _searchString = '';

  private _disposables = new DisposableGroup();

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(window, 'mousedown', this._onClickAway);
    this._disposables.addFromEvent(window, 'keydown', this._keyDownListener, {
      // Workaround: Use capture to prevent the event from triggering the hotkey bindings action
      capture: true,
    });
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });

    const richText = getRichTextByModel(this.model);
    if (!richText) {
      console.warn(
        'Slash Menu may not work properly! No rich text found for model',
        this.model
      );
      return;
    }
    this._disposables.addFromEvent(richText, 'keydown', this._keyDownListener, {
      // Workaround: Use capture to prevent the event from triggering the keyboard bindings action
      capture: true,
    });
    // this._disposables.addFromEvent(richText, 'focusout', this._onClickAway);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  // Handle click outside
  private _onClickAway = (e: Event) => {
    // if (e.target === this) return;
    if (!this._hide) return;
    // If the slash menu is hidden, click anywhere will close the slash menu
    this.abortController.abort();
  };

  /**
   * Handle arrow key
   *
   * The slash menu will be closed in the following keyboard cases:
   * - Press the space key
   * - Press the backspace key and the search string is empty
   * - Press the escape key
   * - When the search item is empty, the slash menu will be hidden temporarily,
   *   and if the following key is not the backspace key, the slash menu will be closed
   */
  private _keyDownListener = (e: KeyboardEvent) => {
    if (e.key === '/') {
      // Can not stopPropagation here,
      // otherwise the rich text will not be able to trigger a new the slash menu
      return;
    }
    // This listener be bind to the window and the rich text element
    // So we need to ensure that the event is triggered once.
    // We also need to prevent the event from triggering the keyboard bindings action
    e.stopPropagation();
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
    if (e.key === ' ' || e.key === 'Escape') {
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
    // Assume input a character, append it to the search string
    if (e.key.length === 1) {
      this._searchString += e.key;
      this._filterItems = this._updateItem();
      if (!this._filterItems.length) {
        this._hide = true;
      }
      return;
    }

    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Enter',
        'Tab',
      ].includes(e.key)
    ) {
      return;
    }
    // prevent arrow key from moving cursor
    e.preventDefault();
    const configLen = this._filterItems.length;

    const handleCursorUp = () => {
      if (this._leftPanelActivated) {
        const nowGroupIdx = this._getGroupIndexByItem(
          this._filterItems[this._activatedItemIndex]
        );
        this._handleClickCategory(
          menuGroups[(nowGroupIdx - 1 + menuGroups.length) % menuGroups.length]
        );
        return;
      }
      this._activatedItemIndex =
        (this._activatedItemIndex - 1 + configLen) % configLen;
      this._scrollToItem(this._filterItems[this._activatedItemIndex]);
    };

    const handleCursorDown = () => {
      if (this._leftPanelActivated) {
        const nowGroupIdx = this._getGroupIndexByItem(
          this._filterItems[this._activatedItemIndex]
        );
        this._handleClickCategory(
          menuGroups[(nowGroupIdx + 1) % menuGroups.length]
        );
        return;
      }
      this._activatedItemIndex = (this._activatedItemIndex + 1) % configLen;
      this._scrollToItem(this._filterItems[this._activatedItemIndex]);
    };

    switch (e.key) {
      case 'Enter': {
        if (e.isComposing) {
          return;
        }
        this._handleClickItem(this._activatedItemIndex);
        return;
      }
      case 'Tab': {
        if (e.shiftKey) {
          handleCursorUp();
        } else {
          handleCursorDown();
        }
        return;
      }

      case 'ArrowUp': {
        handleCursorUp();
        return;
      }

      case 'ArrowDown': {
        handleCursorDown();
        return;
      }

      case 'ArrowLeft':
        this._leftPanelActivated = true;
        return;
      case 'ArrowRight':
        if (this._leftPanelActivated) {
          this._leftPanelActivated = false;
        }
        return;
      default:
        throw new Error(`Unknown key: ${e.key}`);
    }
  };

  private _getGroupIndexByItem(item: SlashItem) {
    return menuGroups.findIndex(group => group.items.includes(item));
  }

  private _updateItem(): SlashItem[] {
    this._activatedItemIndex = 0;
    const searchStr = this._searchString.toLowerCase();
    if (!searchStr) {
      return menuGroups.flatMap(group => group.items);
    }
    return menuGroups
      .flatMap(group => group.items)
      .filter(({ name }) => {
        const pureName = name
          .trim()
          .toLowerCase()
          .split('')
          .filter(char => /[A-Za-z0-9]/.test(char))
          .join('');

        const regex = new RegExp(
          searchStr
            .split('')
            .map(item => `${escapeRegExp(item)}.*`)
            .join(''),
          'i'
        );
        return regex.test(pureName);
      });
  }

  private _scrollToItem(item: SlashItem) {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) {
      return;
    }
    const ele = shadowRoot.querySelector(
      `format-bar-button[text="${item.name}"]`
    );
    if (!ele) {
      return;
    }
    // `scrollIntoViewIfNeeded` is not a standard API
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
    if (
      'scrollIntoViewIfNeeded' in ele &&
      ele.scrollIntoViewIfNeeded instanceof Function
    ) {
      ele.scrollIntoViewIfNeeded();
      return;
    }
    ele.scrollIntoView(true);
  }

  private _handleClickItem(index: number) {
    if (
      this._leftPanelActivated ||
      index < 0 ||
      index >= this._filterItems.length
    ) {
      return;
    }
    // Need to remove the search string
    // We must to do clean the slash string before we do the action
    // Otherwise, the action may change the model and cause the slash string to be changed
    this.abortController.abort(this._searchString);

    const { action } = this._filterItems[index];
    action({ page: this.model.page, model: this.model });
  }

  private _handleClickCategory(group: { name: string; items: SlashItem[] }) {
    const menuGroup = menuGroups.find(g => g.name === group.name);
    if (!menuGroup) return;
    const item = menuGroup.items[0];
    this._scrollToItem(item);
    this._activatedItemIndex = this._filterItems.findIndex(
      i => i.name === item.name
    );
  }

  private _categoryTemplate() {
    const showCategory = !this._searchString.length;

    const activatedCategory = menuGroups.find(group =>
      group.items.some(
        item => item.name === this._filterItems[this._activatedItemIndex].name
      )
    );

    return html`<div
      class="slash-category ${!showCategory ? 'slash-category-hide' : ''}"
    >
      ${menuGroups.map(
        group =>
          html`<div
            class="slash-category-name ${activatedCategory?.name === group.name
              ? 'slash-active-category'
              : ''}"
            @click=${() => this._handleClickCategory(group)}
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

    const MAX_HEIGHT_WITH_CATEGORY = 408;
    const MAX_HEIGHT = 344;
    const showCategory = !this._searchString.length;

    const containerStyles = styleMap({
      left: this.left,
      top: this.top,
    });

    const slashMenuStyles = styleMap({
      top: this.position === 'bottom' ? '100%' : null,
      bottom: this.position !== 'bottom' ? '100%' : null,
      maxHeight: this.maxHeight
        ? `${Math.min(
            this.maxHeight,
            showCategory ? MAX_HEIGHT_WITH_CATEGORY : MAX_HEIGHT
          )}px`
        : null,
    });

    const btnItems = this._filterItems.map(
      ({ name, icon, divider }, index) => html`<div
          class="slash-item-divider"
          ?hidden=${!divider || !!this._searchString.length}
        ></div>
        <format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          ?hover=${!this._leftPanelActivated &&
          this._activatedItemIndex === index}
          text="${name}"
          data-testid="${name}"
          @mousemove=${() => {
            // Use `mousemove` instead of `mouseover` to avoid navigate conflict in left panel
            this._leftPanelActivated = false;
            this._activatedItemIndex = index;
          }}
          @click=${() => {
            this._handleClickItem(index);
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
