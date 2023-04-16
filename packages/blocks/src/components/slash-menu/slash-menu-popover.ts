import type { BaseBlockModel } from '@blocksuite/store';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  getRichTextByModel,
  isFuzzyMatch,
  WithDisposable,
} from '../../__internal__/utils/index.js';
import { createKeydownObserver } from '../utils.js';
import { menuGroups, type SlashItem } from './config.js';
import { styles } from './styles.js';

@customElement('slash-menu')
export class SlashMenu extends WithDisposable(LitElement) {
  static override styles = styles;

  @property()
  model!: BaseBlockModel;

  @query('.slash-menu')
  slashMenuElement?: HTMLElement;

  @state()
  private _leftPanelActivated = false;

  @state()
  private _activatedItemIndex = 0;

  @state()
  private _filterItems: SlashItem[] = [];

  @state()
  private _hide = false;

  @state()
  private _position: {
    x: string;
    y: string;
    height: number;
  } | null = null;

  abortController = new AbortController();

  /**
   * Does not include the slash character
   */
  private _searchString = '';

  get enabledDatabase() {
    return !!this.model.page.awarenessStore.getFlag('enable_database');
  }

  get filteredMenuGroups() {
    return this.enabledDatabase
      ? menuGroups
      : menuGroups.filter(group => group.name !== 'Database');
  }

  get filterItems() {
    return this.enabledDatabase
      ? this._filterItems
      : this._filterItems.filter(item => {
          if (!item.alias) return true;
          return item.alias.indexOf('database') === -1;
        });
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(window, 'mousedown', this._onClickAway);
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });
    this._filterItems = this.filteredMenuGroups.flatMap(group => group.items);

    const richText = getRichTextByModel(this.model);
    if (!richText) {
      console.warn(
        'Slash Menu may not work properly! No rich text found for model',
        this.model
      );
      return;
    }

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
    createKeydownObserver({
      target: richText,
      abortController: this.abortController,
      interceptor: (e, next) => {
        if (e.key === '/') {
          // Can not stopPropagation here,
          // otherwise the rich text will not be able to trigger a new the slash menu
          return;
        }
        if (this._hide && e.key !== 'Backspace') {
          // if the following key is not the backspace key,
          // the slash menu will be closed
          this.abortController.abort();
          return;
        }
        if (this._hide) {
          this._hide = false;
        }

        if (e.key === 'ArrowLeft') {
          e.stopPropagation();
          e.preventDefault();
          // If the left panel is hidden, should not activate it
          if (this._searchString.length) return;
          this._leftPanelActivated = true;
          return;
        }
        if (e.key === 'ArrowRight') {
          e.stopPropagation();
          e.preventDefault();
          this._leftPanelActivated = false;
          return;
        }
        next();
      },
      onUpdateQuery: val => {
        const newFilteredItems = this._updateItem(val);
        this._filterItems = newFilteredItems;
        if (!newFilteredItems.length) {
          this._hide = true;
        }
      },
      onMove: step => {
        const configLen = this.filterItems.length;
        if (this._leftPanelActivated) {
          const nowGroupIdx = this._getGroupIndexByItem(
            this.filterItems[this._activatedItemIndex]
          );
          this._handleClickCategory(
            this.filteredMenuGroups[
              (nowGroupIdx + step + this.filteredMenuGroups.length) %
                this.filteredMenuGroups.length
            ]
          );
          return;
        }
        this._activatedItemIndex =
          (this._activatedItemIndex + step + configLen) % configLen;
        this._scrollToItem(this.filterItems[this._activatedItemIndex], false);
      },
      onConfirm: () => {
        this._handleClickItem(this._activatedItemIndex);
      },
      onEsc: () => {
        this.abortController.abort();
      },
    });
  }

  updatePosition(position: { x: string; y: string; height: number }) {
    this._position = position;
  }

  // Handle click outside
  private _onClickAway = (e: Event) => {
    // if (e.target === this) return;
    if (!this._hide) return;
    // If the slash menu is hidden, click anywhere will close the slash menu
    this.abortController.abort();
  };

  private _getGroupIndexByItem(item: SlashItem) {
    return this.filteredMenuGroups.findIndex(group =>
      group.items.includes(item)
    );
  }

  private _updateItem(query: string): SlashItem[] {
    this._searchString = query;
    this._activatedItemIndex = 0;
    // Activate the right panel when search string is not empty
    if (this._leftPanelActivated) {
      this._leftPanelActivated = false;
    }
    const searchStr = this._searchString.toLowerCase();
    if (!searchStr) {
      return this.filteredMenuGroups.flatMap(group => group.items);
    }
    return this.filteredMenuGroups
      .flatMap(group => group.items)
      .filter(({ name, alias = [] }) =>
        [name, ...alias].some(str => isFuzzyMatch(str, searchStr))
      );
  }

  private _scrollToItem(item: SlashItem, force = true) {
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
    if (force) {
      // set parameter to `true` to align to top
      ele.scrollIntoView(true);
      return;
    }
    ele.scrollIntoView({
      block: 'nearest',
    });
  }

  private _handleClickItem(index: number) {
    if (
      this._leftPanelActivated ||
      index < 0 ||
      index >= this.filterItems.length
    ) {
      return;
    }
    // Need to remove the search string
    // We must to do clean the slash string before we do the action
    // Otherwise, the action may change the model and cause the slash string to be changed
    this.abortController.abort(this._searchString);

    const { action } = this.filterItems[index];
    action({ page: this.model.page, model: this.model });
  }

  private _handleClickCategory(group: { name: string; items: SlashItem[] }) {
    const menuGroup = this.filteredMenuGroups.find(g => g.name === group.name);
    if (!menuGroup) return;
    const item = menuGroup.items[0];
    this._scrollToItem(item);
    this._activatedItemIndex = this.filterItems.findIndex(
      i => i.name === item.name
    );
  }

  private _categoryTemplate() {
    const showCategory = !this._searchString.length;
    const activatedCategory = this.filteredMenuGroups.find(group =>
      group.items.some(
        item => item.name === this.filterItems[this._activatedItemIndex].name
      )
    );

    return html`<div
      class="slash-category ${!showCategory ? 'slash-category-hide' : ''}"
    >
      ${this.filteredMenuGroups.map(
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
      return nothing;
    }

    const MAX_HEIGHT_WITH_CATEGORY = 408;
    const MAX_HEIGHT = 344;
    const showCategory = !this._searchString.length;

    const slashMenuStyles = this._position
      ? styleMap({
          transform: `translate(${this._position.x}, ${this._position.y})`,
          maxHeight: `${Math.min(
            this._position.height,
            showCategory ? MAX_HEIGHT_WITH_CATEGORY : MAX_HEIGHT
          )}px`,
        })
      : styleMap({
          visibility: 'hidden',
        });

    const btnItems = this.filterItems.map(
      ({ name, icon, divider, disabled = false }, index) => html`<div
          class="slash-item-divider"
          ?hidden=${!divider || !!this._searchString.length}
        ></div>
        <format-bar-button
          ?disabled=${disabled}
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          ?hover=${!disabled &&
          !this._leftPanelActivated &&
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

    return html`<div class="slash-menu-container">
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
