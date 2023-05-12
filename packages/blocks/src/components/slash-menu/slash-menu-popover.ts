import { type BaseBlockModel } from '@blocksuite/store';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  getRichTextByModel,
  isControlledKeyboardEvent,
  isFuzzyMatch,
  WithDisposable,
} from '../../__internal__/utils/index.js';
import { createKeydownObserver } from '../utils.js';
import { menuGroups, type SlashItem } from './config.js';
import { styles } from './styles.js';

function collectGroupNames(menuItem: SlashItem[]) {
  return menuItem.reduce((acc, item) => {
    if (!acc.length || acc[acc.length - 1] !== item.groupName) {
      acc.push(item.groupName);
    }
    return acc;
  }, [] as string[]);
}

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

  get menuGroups() {
    return menuGroups;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(window, 'mousedown', this._onClickAway);
    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });
    this._filterItems = this._updateItem('');

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
        if (e.key === ' ') {
          this._hide = true;
          next();
          return;
        }
        if (this._hide) {
          this._hide = false;
        }

        const isControlled = isControlledKeyboardEvent(e);
        const isShift = e.shiftKey;
        if (e.key === 'ArrowLeft' && !isControlled && !isShift) {
          e.stopPropagation();
          e.preventDefault();
          // If the left panel is hidden, should not activate it
          if (this._searchString.length) return;
          this._leftPanelActivated = true;
          return;
        }
        if (e.key === 'ArrowRight' && !isControlled && !isShift) {
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
        const configLen = this._filterItems.length;
        if (this._leftPanelActivated) {
          const groupNames = collectGroupNames(this._filterItems);
          const nowGroupIdx = groupNames.findIndex(
            groupName =>
              groupName ===
              this._filterItems[this._activatedItemIndex].groupName
          );
          const targetGroup =
            groupNames[
              (nowGroupIdx + step + groupNames.length) % groupNames.length
            ];
          this._handleClickCategory(targetGroup);
          return;
        }
        let ejectedCnt = configLen;
        do {
          this._activatedItemIndex =
            (this._activatedItemIndex + step + configLen) % configLen;
          // Skip disabled items
        } while (
          this._filterItems[this._activatedItemIndex].disabled &&
          // If all items are disabled, the loop will never end
          ejectedCnt--
        );

        this._scrollToItem(this._filterItems[this._activatedItemIndex], false);
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

  private _updateItem(query: string): SlashItem[] {
    this._searchString = query;
    this._activatedItemIndex = 0;
    // Activate the right panel when search string is not empty
    if (this._leftPanelActivated) {
      this._leftPanelActivated = false;
    }
    const searchStr = this._searchString.toLowerCase();
    let allMenus = this.menuGroups.flatMap(group => group.items);

    allMenus = allMenus.filter(({ showWhen = () => true }) =>
      showWhen(this.model)
    );
    if (!searchStr) {
      return allMenus;
    }

    return allMenus.filter(({ name, alias = [] }) =>
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

  private _handleClickCategory(groupName: string) {
    const item = this._filterItems.find(item => item.groupName === groupName);
    if (!item) return;
    this._scrollToItem(item);
    this._activatedItemIndex = this._filterItems.findIndex(
      i => i.name === item.name
    );
  }

  private _categoryTemplate() {
    const showCategory = !this._searchString.length;
    const activatedGroupName =
      this._filterItems[this._activatedItemIndex]?.groupName;
    const groups = collectGroupNames(this._filterItems);

    return html`<div
      class="slash-category ${!showCategory ? 'slash-category-hide' : ''}"
    >
      ${groups.map(
        groupName =>
          html`<div
            class="slash-category-name ${activatedGroupName === groupName
              ? 'slash-active-category'
              : ''}"
            @click=${() => this._handleClickCategory(groupName)}
          >
            ${groupName}
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

    const btnItems = this._filterItems.map(
      ({ name, icon, disabled = false, groupName }, index) => {
        const showDivider =
          index !== 0 && this._filterItems[index - 1].groupName !== groupName;
        return html`<div
            class="slash-item-divider"
            ?hidden=${!showDivider || !!this._searchString.length}
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
          </format-bar-button>`;
      }
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
