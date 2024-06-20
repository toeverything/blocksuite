import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { autoPlacement, offset } from '@floating-ui/dom';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';

import { createLitPortal } from '../../../_common/components/portal.js';
import {
  cleanSpecifiedTail,
  createKeydownObserver,
} from '../../../_common/components/utils.js';
import { ArrowDownIcon } from '../../../_common/icons/index.js';
import {
  getInlineEditorByModel,
  isControlledKeyboardEvent,
} from '../../../_common/utils/index.js';
import { isFuzzyMatch } from '../../../_common/utils/string.js';
import type {
  SlashMenuActionItem,
  SlashMenuContext,
  SlashMenuGroupDivider,
  SlashMenuItem,
  SlashMenuStaticConfig,
  SlashMenuStaticItem,
  SlashSubMenu,
} from './config.js';
import { slashItemToolTipStyle, styles } from './styles.js';
import {
  getFirstNotDividerItem,
  isActionItem,
  isGroupDivider,
  isSubMenuItem,
  notGroupDivider,
  slashItemClassName,
} from './utils.js';

type InnerSlashMenuContext = SlashMenuContext & {
  tooltipTimeout: number;
  onClickItem: (item: SlashMenuActionItem) => void;
};

@customElement('affine-slash-menu')
export class SlashMenu extends WithDisposable(LitElement) {
  get host() {
    return this.context.rootElement.host;
  }

  static override styles = styles;

  @state()
  private accessor _filteredItems: (SlashMenuActionItem | SlashSubMenu)[] = [];

  @state()
  private accessor _position: {
    x: string;
    y: string;
    height: number;
  } | null = null;

  private _innerSlashMenuContext!: InnerSlashMenuContext;

  private _itemPathMap = new Map<SlashMenuItem, number[]>();

  private _query = '';

  private _queryState: 'off' | 'on' | 'no_result' = 'off';

  @property({ attribute: false })
  accessor context!: SlashMenuContext;

  @property({ attribute: false })
  accessor config!: SlashMenuStaticConfig;

  @property({ attribute: false })
  accessor triggerKey!: string;

  @query('inner-slash-menu')
  accessor slashMenuElement!: HTMLElement;

  abortController = new AbortController();

  private _initItemPathMap = () => {
    const traverse = (item: SlashMenuStaticItem, path: number[]) => {
      this._itemPathMap.set(item, [...path]);
      if (isSubMenuItem(item)) {
        item.subMenu.forEach((subItem, index) =>
          traverse(subItem, [...path, index])
        );
      }
    };

    this.config.items.forEach((item, index) => traverse(item, [index]));
  };

  private _updateFilteredItems = (query: string) => {
    this._filteredItems = [];

    const searchStr = query.toLowerCase();
    if (searchStr === '' || searchStr.endsWith(' ')) {
      this._query = searchStr;
      this._queryState = searchStr === '' ? 'off' : 'no_result';
      return;
    }

    // Layer order traversal
    let depth = 0;
    let queue = this.config.items.filter(notGroupDivider);
    while (queue.length !== 0) {
      // remove the sub menu item from the previous layer result
      this._filteredItems = this._filteredItems.filter(
        item => !isSubMenuItem(item)
      );

      this._filteredItems = this._filteredItems.concat(
        queue.filter(({ name, alias = [] }) =>
          [name, ...alias].some(str => isFuzzyMatch(str, searchStr))
        )
      );

      // We search first and second layer
      if (this._filteredItems.length !== 0 && depth >= 1) break;

      queue = queue
        .map<typeof queue>(item => {
          if (isSubMenuItem(item)) {
            return item.subMenu.filter(notGroupDivider);
          } else {
            return [];
          }
        })
        .flat();

      depth++;
    }

    // make items in the same group in order
    this._filteredItems = this._filteredItems.sort((a, b) => {
      if (a.name.toLowerCase() === searchStr) return -1;
      if (b.name.toLowerCase() === searchStr) return 1;

      const aPath = this._itemPathMap.get(a);
      const bPath = this._itemPathMap.get(b);

      assertExists(aPath);
      assertExists(bPath);

      for (let i = 0; i < Math.min(aPath.length, bPath.length); i++) {
        if (aPath[i] < bPath[i]) return -1;
        if (aPath[i] > bPath[i]) return 1;
      }
      return aPath.length - bPath.length;
    });

    this._query = query;
    this._queryState = this._filteredItems.length === 0 ? 'no_result' : 'on';
  };

  private _handleClickItem = (item: SlashMenuActionItem) => {
    // Need to remove the search string
    // We must to do clean the slash string before we do the action
    // Otherwise, the action may change the model and cause the slash string to be changed
    cleanSpecifiedTail(
      this.host,
      this.context.model,
      this.triggerKey + this._query
    );
    item.action(this.context)?.catch(console.error);
    this.abortController.abort();
  };

  override connectedCallback() {
    super.connectedCallback();

    this._innerSlashMenuContext = {
      ...this.context,
      onClickItem: this._handleClickItem,
      tooltipTimeout: this.config.tooltipTimeout,
    };

    this._initItemPathMap();

    this._disposables.addFromEvent(this, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });

    const { model } = this.context;

    const inlineEditor = getInlineEditorByModel(this.host, model);
    assertExists(inlineEditor, 'RichText InlineEditor not found');

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
      target: inlineEditor.eventSource,
      inlineEditor,
      abortController: this.abortController,
      interceptor: (event, next) => {
        const { key, isComposing, code } = event;
        if (key === this.triggerKey) {
          // Can not stopPropagation here,
          // otherwise the rich text will not be able to trigger a new the slash menu
          return;
        }

        if (key === 'Process' && !isComposing && code === 'Slash') {
          // The IME case of above
          return;
        }

        if (key !== 'Backspace' && this._queryState === 'no_result') {
          // if the following key is not the backspace key,
          // the slash menu will be closed
          this.abortController.abort();
          return;
        }

        if (key === 'ArrowRight' || key === 'ArrowLeft' || key === 'Escape') {
          return;
        }

        next();
      },
      onUpdateQuery: query => {
        this._updateFilteredItems(query);
      },
      onMove: () => {},
      onConfirm: () => {},
    });
  }

  updatePosition = (position: { x: string; y: string; height: number }) => {
    this._position = position;
  };

  override render() {
    const slashMenuStyles = this._position
      ? {
          transform: `translate(${this._position.x}, ${this._position.y})`,
          maxHeight: `${Math.min(this._position.height, this.config.maxHeight)}px`,
        }
      : {
          visibility: 'hidden',
        };

    return html`${this._queryState !== 'no_result'
        ? html` <div
            class="overlay-mask"
            @click="${() => this.abortController.abort()}"
          ></div>`
        : nothing}
      <inner-slash-menu
        .context=${this._innerSlashMenuContext}
        .menu=${this._queryState === 'off'
          ? this.config.items
          : this._filteredItems}
        .onClickItem=${this._handleClickItem}
        .mainMenuStyle=${slashMenuStyles}
        .abortController=${this.abortController}
      >
      </inner-slash-menu>`;
  }
}

@customElement('inner-slash-menu')
export class InnerSlashMenu extends WithDisposable(LitElement) {
  static override styles = styles;

  @state()
  private accessor _activeItem!: SlashMenuActionItem | SlashSubMenu;

  private _currentSubMenu: SlashSubMenu | null = null;

  private _subMenuAbortController: AbortController | null = null;

  @property({ attribute: false })
  accessor context!: InnerSlashMenuContext;

  @property({ attribute: false })
  accessor menu!: SlashMenuStaticItem[];

  @property({ attribute: false })
  accessor depth: number = 0;

  @property({ attribute: false })
  accessor abortController!: AbortController;

  @property({ attribute: false })
  accessor mainMenuStyle: Parameters<typeof styleMap>[0] | null = null;

  private _scrollToItem(item: SlashMenuStaticItem) {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) {
      return;
    }

    const text = isGroupDivider(item) ? item.groupName : item.name;

    const ele = shadowRoot.querySelector(`icon-button[text="${text}"]`);
    if (!ele) {
      return;
    }
    ele.scrollIntoView({
      block: 'nearest',
    });
  }

  private _openSubMenu = (item: SlashSubMenu) => {
    if (item === this._currentSubMenu) return;

    const itemElement = this.shadowRoot?.querySelector(
      `.${slashItemClassName(item)}`
    );
    if (!itemElement) return;

    this._closeSubMenu();
    this._currentSubMenu = item;
    this._subMenuAbortController = new AbortController();
    this._subMenuAbortController.signal.addEventListener('abort', () => {
      this._closeSubMenu();
    });

    const subMenuElement = createLitPortal({
      shadowDom: false,
      template: html`<inner-slash-menu
        .context=${this.context}
        .menu=${item.subMenu}
        .depth=${this.depth + 1}
        .abortController=${this._subMenuAbortController}
      >
        ${item.subMenu.map(this._renderItem)}
      </inner-slash-menu>`,
      computePosition: {
        referenceElement: itemElement,
        autoUpdate: true,
        middleware: [
          offset(12),
          autoPlacement({
            allowedPlacements: ['right-start', 'right-end'],
          }),
        ],
      },
      abortController: this._subMenuAbortController,
    });

    subMenuElement.style.zIndex = `calc(var(--affine-z-index-popover) + ${this.depth})`;
    subMenuElement.focus();
  };

  private _closeSubMenu = () => {
    this._subMenuAbortController?.abort();
    this._subMenuAbortController = null;
    this._currentSubMenu = null;
  };

  private _renderGroupItem = (item: SlashMenuGroupDivider) => {
    return html`<div class="slash-menu-group-name">${item.groupName}</div>`;
  };

  private _renderActionItem = (item: SlashMenuActionItem) => {
    const { name, icon, description, tooltip, customTemplate } = item;

    const hover = item === this._activeItem;

    return html`<icon-button
      class="slash-menu-item ${slashItemClassName(item)}"
      width="100%"
      height="44px"
      text=${customTemplate ?? name}
      subText=${ifDefined(description)}
      data-testid="${name}"
      hover=${hover}
      @mousemove=${() => {
        this._activeItem = item;
        this._closeSubMenu();
      }}
      @click=${() => this.context.onClickItem(item)}
    >
      ${icon && html`<div class="slash-menu-item-icon">${icon}</div>`}
      ${tooltip &&
      html`<affine-tooltip
        tip-position="right"
        .offset=${22}
        .tooltipStyle=${slashItemToolTipStyle}
        .hoverOptions=${{
          enterDelay: this.context.tooltipTimeout,
          allowMultiple: false,
        }}
      >
        <div class="tooltip-figure">${tooltip.figure}</div>
        <div class="tooltip-caption">${tooltip.caption}</div>
      </affine-tooltip>`}
    </icon-button>`;
  };

  private _renderSubMenuItem = (item: SlashSubMenu) => {
    const { name, icon, description } = item;

    const hover = item === this._activeItem;

    return html`<icon-button
      class="slash-menu-item ${slashItemClassName(item)}"
      width="100%"
      height="44px"
      text=${name}
      subText=${ifDefined(description)}
      data-testid="${name}"
      hover=${hover}
      @mousemove=${() => {
        this._activeItem = item;
        this._openSubMenu(item);
      }}
      @touchstart=${() => {
        isSubMenuItem(item) &&
          (this._currentSubMenu === item
            ? this._closeSubMenu()
            : this._openSubMenu(item));
      }}
    >
      ${icon && html`<div class="slash-menu-item-icon">${icon}</div>`}
      <div slot="suffix" style="transform: rotate(-90deg);">
        ${ArrowDownIcon}
      </div>
    </icon-button>`;
  };

  private _renderItem = (item: SlashMenuStaticItem) => {
    if (isGroupDivider(item)) return this._renderGroupItem(item);
    else if (isActionItem(item)) return this._renderActionItem(item);
    else if (isSubMenuItem(item)) return this._renderSubMenuItem(item);
    else throw new Error('Unreachable');
  };

  override connectedCallback() {
    super.connectedCallback();

    // close all sub menus
    this.abortController?.signal?.addEventListener('abort', () => {
      this._subMenuAbortController?.abort();
    });
    this.addEventListener('wheel', event => {
      if (this._currentSubMenu) {
        event.preventDefault();
      }
    });

    const inlineEditor = getInlineEditorByModel(
      this.context.rootElement.host,
      this.context.model
    );
    assertExists(inlineEditor, 'RichText InlineEditor not found');

    inlineEditor.eventSource.addEventListener(
      'keydown',
      event => {
        if (this._currentSubMenu) return;
        if (event.isComposing) return;

        const { key, ctrlKey, metaKey, altKey, shiftKey } = event;

        const onlyCmd = (ctrlKey || metaKey) && !altKey && !shiftKey;
        const onlyShift = shiftKey && !isControlledKeyboardEvent(event);
        const notControlShift = !(ctrlKey || metaKey || altKey || shiftKey);

        let moveStep = 0;
        if (
          (key === 'ArrowUp' && notControlShift) ||
          (key === 'Tab' && onlyShift) ||
          (key === 'P' && onlyCmd) ||
          (key === 'p' && onlyCmd)
        ) {
          moveStep = -1;
        }

        if (
          (key === 'ArrowDown' && notControlShift) ||
          (key === 'Tab' && notControlShift) ||
          (key === 'n' && onlyCmd) ||
          (key === 'N' && onlyCmd)
        ) {
          moveStep = 1;
        }

        if (moveStep !== 0) {
          let itemIndex = this.menu.indexOf(this._activeItem);
          do {
            itemIndex =
              (itemIndex + moveStep + this.menu.length) % this.menu.length;
          } while (isGroupDivider(this.menu[itemIndex]));

          this._activeItem = this.menu[itemIndex] as typeof this._activeItem;
          this._scrollToItem(this._activeItem);

          event.preventDefault();
          event.stopPropagation();
        }

        if (key === 'ArrowRight' && notControlShift) {
          if (isSubMenuItem(this._activeItem)) {
            this._openSubMenu(this._activeItem);
          }

          event.preventDefault();
          event.stopPropagation();
        }

        if ((key === 'ArrowLeft' || key === 'Escape') && notControlShift) {
          this.abortController.abort();

          event.preventDefault();
          event.stopPropagation();
        }

        if (key === 'Enter' && notControlShift) {
          if (isSubMenuItem(this._activeItem)) {
            this._openSubMenu(this._activeItem);
          } else if (isActionItem(this._activeItem)) {
            this.context.onClickItem(this._activeItem);
          }

          event.preventDefault();
          event.stopPropagation();
        }
      },
      {
        capture: true,
        signal: this.abortController.signal,
      }
    );
  }

  override disconnectedCallback() {
    this.abortController.abort();
  }

  override willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('menu') && this.menu.length !== 0) {
      const firstItem = getFirstNotDividerItem(this.menu);
      assertExists(firstItem);
      this._activeItem = firstItem;

      // this case happen on query updated
      this._subMenuAbortController?.abort();
    }
  }

  override render() {
    if (this.menu.length === 0) return nothing;

    const style = styleMap(this.mainMenuStyle ?? { position: 'relative' });

    return html`<div
      class="slash-menu"
      style=${style}
      data-testid=${`sub-menu-${this.depth}`}
    >
      ${this.menu.map(this._renderItem)}
    </div>`;
  }
}
