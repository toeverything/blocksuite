import type {
  ClientRectObject,
  Middleware,
  Placement,
  VirtualElement,
} from '@floating-ui/dom';
import type { TemplateResult } from 'lit';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  checkboxChecked,
  checkboxUnchecked,
} from '../../../list-block/utils/icons.js';
import { ArrowRightSmallIcon, DoneIcon } from '../../icons/index.js';
import { rangeWrap } from '../../utils/math.js';

type MenuCommon = {
  hide?: () => boolean;
};
type GroupMenu = {
  children: () => NormalMenu[];
  name: string;
  type: 'group';
} & MenuCommon;
// eslint-disable-next-line @typescript-eslint/ban-types
type MenuClass = 'delete-item' | ({} & string);
type NormalMenu = (
  | {
      checked: boolean;
      class?: string;
      label?: TemplateResult;
      name: string;
      postfix?: TemplateResult;
      select: (checked: boolean) => boolean;
      type: 'checkbox';
    }
  | {
      class?: MenuClass;
      icon?: TemplateResult;
      isSelected?: boolean;
      label?: TemplateResult;
      name: string;
      onHover?: (hover: boolean) => void;
      postfix?: TemplateResult;
      select: () => void;
      type: 'action';
    }
  | {
      class?: string;
      label?: TemplateResult;
      name: string;
      on: boolean;
      onChange: (on: boolean) => void;
      postfix?: TemplateResult;
      type: 'toggle-switch';
    }
  | {
      icon?: TemplateResult;
      isSelected?: boolean;
      label?: TemplateResult;
      name: string;
      options: MenuOptions;
      postfix?: TemplateResult;
      select?: () => void;
      type: 'sub-menu';
    }
  | {
      render: TemplateResult;
      type: 'custom';
    }
) &
  MenuCommon;
export type Menu = GroupMenu | NormalMenu;
type GetMenuByType<T extends Menu['type'], M extends Menu = Menu> = M extends {
  type: T;
}
  ? M
  : never;
export type MenuOptions = {
  input?: {
    divider?: boolean;
    icon?: TemplateResult;
    initValue?: string;
    left?: TemplateResult;
    onComplete?: (text: string) => void;
    placeholder?: string;
    right?: TemplateResult;
    search?: boolean;
  };
  items: Menu[];
  onClose?: () => void;
  onComplete?: () => void;
  style?: string;
};

type ItemBase = {
  class?: string;
  downDivider?: boolean;
  label: TemplateResult;
  mouseEnter?: () => void;
  onHover?: (hover: boolean) => void;
  upDivider?: boolean;
};

type NormalItem = {
  type: 'normal';
} & ItemBase;

type SelectItem = {
  select: () => void;
  type: 'select';
} & ItemBase;

type UIItem = {
  downDivider?: boolean;
  render: TemplateResult;
  type: 'ui';
  upDivider?: boolean;
};

type Item = NormalItem | SelectItem | UIItem;

const isSelectableItem = (item: Item): item is SelectItem => {
  return item.type === 'select';
};

@customElement('affine-menu')
export class MenuComponent<_T> extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-menu {
      font-family: var(--affine-font-family);
      display: flex;
      flex-direction: column;
      user-select: none;
      min-width: 276px;
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      background-color: var(--affine-background-overlay-panel-color);
      padding: 8px;
      position: absolute;
      z-index: 999;
    }

    affine-menu * {
      box-sizing: border-box;
    }

    .affine-menu-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .affine-menu-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
    }

    .affine-menu-header .icon {
    }
    .affine-menu-header input {
      flex: 1;
      border-radius: 4px;
      outline: none;
      font-size: 14px;
      line-height: 22px;
      padding: 5px 12px;
      border: 1px solid var(--affine-border-color);
    }

    .affine-menu-header input::placeholder {
      color: var(--affine-placeholder-color);
    }

    .affine-menu-header input:focus {
      border: 1px solid var(--affine-primary-color);
    }

    .affine-menu-action {
      padding: 4px 12px;
      cursor: pointer;
      display: flex;
      gap: 4px;
      border-radius: 4px;
    }

    .affine-menu-action svg {
      width: 20px;
      height: 20px;
      color: var(--affine-icon-color);
      fill: var(--affine-icon-color);
    }

    .affine-menu-action .icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .affine-menu-action .content {
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      justify-content: space-between;
      display: flex;
      align-items: center;
      font-size: 14px;
      line-height: 22px;
      flex: 1;
      gap: 8px;
    }

    .affine-menu-action.selected {
      background-color: var(--affine-hover-color);
    }

    .affine-menu-action.selected.delete-item {
      background-color: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }

    .affine-menu-action.selected.delete-item .icon > svg {
      color: var(--affine-error-color);
    }

    .affine-menu-action.selected-item {
      color: var(--affine-text-emphasis-color);
    }

    .affine-menu-action.selected-item svg {
      color: var(--affine-text-emphasis-color);
      fill: currentColor;
    }

    .database-menu-component-action-button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .no-results {
      font-size: 12px;
      line-height: 20px;
      color: var(--affine-text-secondary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 8px;
    }

    .affine-menu-action-text {
      flex: 1;
      padding: 0 4px;
    }
  `;

  private _checked: Record<string, boolean> = {};

  private _clickContainer = (e: MouseEvent) => {
    e.stopPropagation();
    this.focusInput();
  };

  private _complete = () => {
    this.options.onComplete?.();
    this.close();
  };

  private _inputText = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    this.text = target.value;
  };

  private _mouseEnter = (index?: number) => {
    if (this._isConsciousChoice()) {
      return;
    }
    if (index !== this.selectedIndex) {
      this.selectedIndex = index;
      this.clearSubMenu();
      this.selectedItem?.mouseEnter?.();
    }
  };

  private allItems: Array<{ index?: number } & Item> = [];

  private initTime = 0;

  private inputRef = createRef<HTMLInputElement>();

  private processMap: {
    [K in Menu['type']]: (menu: GetMenuByType<K>) => Item[];
  } = {
    action: menu => {
      const icon = menu.icon
        ? html` <div class="icon">${menu.icon}</div>`
        : nothing;
      const postfixIcon =
        menu.postfix ?? (menu.isSelected ? DoneIcon : undefined);
      const postfix = postfixIcon
        ? html` <div class="icon">${postfixIcon}</div>`
        : nothing;
      return [
        {
          class: menu.class ?? (menu.isSelected ? 'selected-item' : ''),
          label: html`
            ${icon}
            <div class="affine-menu-action-text">
              ${menu.label ?? menu.name}
            </div>
            ${postfix}
          `,
          onHover: menu.onHover,
          select: () => {
            menu.select();
            this._complete();
          },
          type: 'select',
        },
      ];
    },
    checkbox: menu => {
      const postfix = menu.postfix
        ? html` <div class="icon">${menu.postfix}</div>`
        : nothing;
      const checked = this.getChecked(menu.name) ?? menu.checked;
      return [
        {
          class: menu.class ?? '',
          label: html`
            <div class="icon">
              ${checked ? checkboxChecked() : checkboxUnchecked()}
            </div>
            <div class="affine-menu-action-text">
              ${menu.label ?? menu.name}
            </div>
            ${postfix}
          `,
          select: () => {
            this.setChecked(menu.name, menu.select(checked));
          },
          type: 'select',
        },
      ];
    },
    custom: menu => {
      return [
        {
          render: menu.render,
          type: 'ui',
        },
      ];
    },
    group: menu => {
      const items = menu.children().flatMap(menu => this.process(menu));
      if (items[0]) {
        items[0].upDivider = true;
      }
      if (items[items.length - 1]) {
        items[items.length - 1].downDivider = true;
      }
      return items;
    },
    'sub-menu': menu => {
      const openSubMenu = () => {
        this.subMenu?.remove();
        setTimeout(() => {
          const subMenu = new MenuComponent();
          const options = menu.options;
          subMenu.options = {
            ...options,
            onClose: () => {
              options.onClose?.();
              this.clearSubMenu();
            },
            onComplete: () => {
              this._complete();
            },
          };
          this.append(subMenu);
          computePosition(this, subMenu, {
            middleware: [
              flip({
                fallbackPlacements: ['left-start', 'right-end', 'left-end'],
              }),
              offset(4),
            ],
            placement: 'right-start',
          })
            .then(({ x, y }) => {
              Object.assign(subMenu.style, {
                left: `${x}px`,
                top: `${y}px`,
              });
            })
            .catch(console.error);
          this.subMenu = subMenu;
        });
      };
      const select = () => {
        menu.select?.();
        menu.select ? this._complete() : openSubMenu();
      };
      const postfix = html` <div class="icon">
        ${menu.postfix ?? ArrowRightSmallIcon}
      </div>`;
      return [
        {
          class: menu.isSelected ? 'selected-item' : '',
          label: html`${menu.icon
              ? html` <div class="icon">${menu.icon}</div>`
              : nothing}
            <div class="affine-menu-action-text">
              ${menu.label ?? menu.name}
            </div>
            ${postfix}`,
          mouseEnter: openSubMenu,
          select,
          type: 'select',
        },
      ];
    },
    'toggle-switch': menu => {
      const postfix = menu.postfix
        ? html` <div class="icon">${menu.postfix}</div>`
        : nothing;

      const onChange = (on: boolean) => {
        menu.onChange(on);
      };

      return [
        {
          class: menu.class ?? '',
          label: html`
            <div class="affine-menu-action-text">
              ${menu.label ?? menu.name}
            </div>

            <toggle-switch .on=${menu.on} .onChange=${onChange}></toggle-switch>
            ${postfix}
          `,
          type: 'normal',
        },
      ];
    },
  };

  private selectableItems!: Array<SelectItem>;

  private subMenu?: HTMLElement;

  mouseEnterHeader = () => {
    if (this.isSearchMode) {
      return;
    }
    this._mouseEnter(-1);
  };

  private _isConsciousChoice() {
    return Date.now() < this.initTime + 100;
  }

  private clearSubMenu() {
    this.subMenu?.remove();
    this.subMenu = undefined;
    this.focusInput();
  }

  private close() {
    this.options.onClose?.();
  }

  private focusInput() {
    this.inputRef.value?.focus();
  }

  private getChecked(name: string): boolean {
    return this._checked[name];
  }

  private get isSearchMode() {
    return this.options.input?.search;
  }

  private get minIndex() {
    return this.isSearchMode ? 0 : -1;
  }

  private process(menu: Menu): Item[] {
    if (this.show(menu)) {
      return this.processMap[menu.type](menu as never);
    } else {
      return [];
    }
  }

  private get selectedIndex(): number | undefined {
    return this._selectedIndex;
  }

  private set selectedIndex(index: number | undefined) {
    const old =
      this._selectedIndex != null
        ? this.selectableItems[this._selectedIndex]
        : undefined;
    old?.onHover?.(false);
    if (index == null) {
      this._selectedIndex = index;
      return;
    }
    const newIndex = rangeWrap(
      index ?? this.minIndex,
      this.minIndex,
      this.selectableItems.length
    );
    this._selectedIndex = newIndex;
    this.selectableItems[newIndex]?.onHover?.(true);
  }

  private get selectedItem(): SelectItem | undefined {
    return this.selectedIndex != null
      ? this.selectableItems[this.selectedIndex]
      : undefined;
  }

  private setChecked(name: string, checked: boolean) {
    this._checked[name] = checked;
    this.requestUpdate();
  }

  private show(item: Menu): boolean {
    if (this.isSearchMode) {
      if (item.type === 'group') {
        return !item.hide?.();
      }
      if (item.type === 'custom') {
        return this.text.length === 0;
      }
      if (!item.name.toLowerCase().includes(this.text.toLowerCase())) {
        return false;
      }
    }
    return !item.hide?.();
  }

  private showHeader() {
    return !this.isSearchMode || !!this.text;
  }

  private get text() {
    return this._text ?? this.options.input?.initValue ?? '';
  }

  private set text(value: string) {
    this._text = value;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.selectedItem?.onHover?.(false);
  }

  override firstUpdated() {
    this.initTime = Date.now();
    const input = this.inputRef.value;
    if (input) {
      requestAnimationFrame(() => {
        this.focusInput();
      });
      const length = input.value.length;
      input.setSelectionRange(length, length);
      this._disposables.addFromEvent(input, 'keydown', e => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          this.close();
          return;
        }
        if (e.key === 'Enter' && !e.isComposing) {
          const selectedItem = this.selectedItem;
          if (selectedItem) {
            selectedItem.select();
          } else {
            this.options.input?.onComplete?.(this.text);
            this._complete();
          }
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex =
            this.selectedIndex != null ? this.selectedIndex - 1 : this.minIndex;
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex =
            this.selectedIndex != null ? this.selectedIndex + 1 : this.minIndex;
          return;
        }
      });

      this._disposables.addFromEvent(input, 'copy', e => {
        e.stopPropagation();
      });
      this._disposables.addFromEvent(input, 'cut', e => {
        e.stopPropagation();
      });
    }
  }

  processItems() {
    this.allItems = [];
    this.selectableItems = [];
    this.options.items
      .flatMap(item => this.process(item))
      .forEach(item => {
        const isSelectable = isSelectableItem(item);
        this.allItems.push({
          ...item,
          index: isSelectable ? this.selectableItems.length : undefined,
        });
        if (isSelectable) {
          this.selectableItems.push(item);
        }
      });
  }

  override render() {
    this.processItems();
    this.selectedIndex = this._selectedIndex;
    const showHeader = this.showHeader();
    const headerStyle = styleMap({
      height: showHeader ? undefined : '0',
      opacity: showHeader ? '1' : '0',
      overflow: showHeader ? undefined : 'hidden',
      position: showHeader ? undefined : 'absolute',
    });
    const showHeaderDivider =
      this.selectableItems.length > 0 &&
      showHeader &&
      this.options.input?.divider !== false;
    return html`
      <div
        class="affine-menu"
        style=${ifDefined(this.options.style)}
        @click="${this._clickContainer}"
      >
        ${this.options.input
          ? html` <div
                class="affine-menu-header"
                style=${headerStyle}
                @mouseenter="${this.mouseEnterHeader}"
              >
                ${this.options.input.icon
                  ? html`<div class="icon">${this.options.input.icon}</div>`
                  : nothing}
                <input
                  autocomplete="off"
                  data-1p-ignore
                  ${ref(this.inputRef)}
                  type="text"
                  placeholder="${this.options.input?.placeholder ?? ''}"
                  value="${this.text ?? this.options.input?.initValue ?? ''}"
                  @input="${this._inputText}"
                />
              </div>
              ${showHeaderDivider
                ? html`<menu-divider style="width: 100%"></menu-divider>`
                : null}`
          : null}
        <div class="affine-menu-body">
          ${this.selectableItems.length === 0 && this.isSearchMode
            ? html` <div class="no-results">No Results</div>`
            : ''}
          ${repeat(this.allItems, (menu, index) => {
            const i = menu.index;
            const hideDividerWhenHeaderDividerIsShow = i === 0;
            const divider =
              menu.upDivider || this.allItems[index - 1]?.downDivider;
            const mouseEnter = () => {
              this._mouseEnter(i);
            };
            if (menu.type === 'ui') {
              return html`
                ${divider
                  ? html`<menu-divider style="width: 100%"></menu-divider>`
                  : null}
                <div @mouseenter=${mouseEnter}>${menu.render}</div>
              `;
            }

            const itemClass = menu.class || 'affine-menu-item';
            const classes = classMap({
              'affine-menu-action': true,
              [itemClass]: true,
              selected: menu.type === 'select' && this._selectedIndex === i,
            });

            const select = () => {
              if (!isSelectableItem(menu)) return;
              menu.select();
            };

            return html`
              ${divider && !hideDividerWhenHeaderDividerIsShow
                ? html`<menu-divider style="width: 100%"></menu-divider>`
                : null}
              <div
                class="${classes}"
                @click=${select}
                @mouseenter=${mouseEnter}
              >
                <div class="content">${menu.label}</div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  @state()
  private accessor _selectedIndex: number | undefined = undefined;

  @state()
  private accessor _text: string | undefined = undefined;

  @property({ attribute: false })
  accessor options!: MenuOptions;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-menu': MenuComponent<unknown>;
  }
}
export const getDefaultModalRoot = (ele: HTMLElement) => {
  const host: HTMLElement | null =
    ele.closest('editor-host') ?? ele.closest('.data-view-popup-container');
  if (host) {
    return host;
  }
  return document.body;
};
export const createModal = (container: HTMLElement = document.body) => {
  const div = document.createElement('div');
  div.style.pointerEvents = 'auto';
  div.style.position = 'absolute';
  div.style.left = '0';
  div.style.top = '0';
  div.style.width = '100%';
  div.style.height = '100%';
  div.style.zIndex = '1001';
  div.style.fontFamily = 'var(--affine-font-family)';
  container.append(div);
  return div;
};
export const positionToVRect = (x: number, y: number): VirtualElement => {
  return {
    getBoundingClientRect(): ClientRectObject {
      return {
        bottom: y,
        height: 0,
        left: x,
        right: x,
        top: y,
        width: 0,
        x: x,
        y: y,
      };
    },
  };
};
export const createPopup = (
  target: HTMLElement,
  content: HTMLElement,
  options?: {
    container?: HTMLElement;
    middleware?: Array<Middleware | false | null | undefined>;
    onClose?: () => void;
    placement?: Placement;
  }
) => {
  const modal = createModal(options?.container ?? getDefaultModalRoot(target));
  autoUpdate(target, content, () => {
    computePosition(target, content, {
      middleware: options?.middleware ?? [shift({ crossAxis: true })],
      placement: options?.placement,
    })
      .then(({ x, y }) => {
        Object.assign(content.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      })
      .catch(console.error);
  });
  modal.append(content);

  modal.onmousedown = ev => {
    if (ev.target === modal) {
      modal.remove();
      options?.onClose?.();
    }
  };

  modal.oncontextmenu = ev => {
    ev.preventDefault();
    if (ev.target === modal) {
      modal.remove();
      options?.onClose?.();
    }
  };

  return () => modal.remove();
};

export type MenuHandler = {
  close: () => void;
};

export const popMenu = <T>(
  target: HTMLElement,
  props: {
    container?: HTMLElement;
    middleware?: Array<Middleware | false | null | undefined>;
    options: MenuOptions;
    placement?: Placement;
  }
): MenuHandler => {
  const menu = new MenuComponent<T>();
  menu.options = {
    ...props.options,
    onClose: () => {
      props.options.onClose?.();
      close();
    },
  };
  const close = createPopup(target, menu, {
    container: props.container,
    middleware: props.middleware,
    onClose: props.options.onClose,
    placement: props.placement,
  });
  return {
    close,
  };
};
export const popFilterableSimpleMenu = (
  target: HTMLElement,
  options: Menu[],
  onClose?: () => void
) => {
  popMenu(target, {
    options: {
      input: {
        placeholder: 'Search',
        search: true,
      },
      items: options,
      onClose,
    },
  });
};
