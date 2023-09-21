import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type {
  ClientRectObject,
  Middleware,
  ReferenceElement,
  VirtualElement,
} from '@floating-ui/dom';
import { autoPlacement, computePosition } from '@floating-ui/dom';
import type { TemplateResult } from 'lit';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { regularizationNumberInRange } from '../../__internal__/utils/math.js';
import { ArrowDownIcon, DoneIcon } from '../../icons/index.js';
import {
  checkboxChecked,
  checkboxUnchecked,
} from '../../list-block/utils/icons.js';

type MenuCommon = {
  hide?: () => boolean;
};
type GroupMenu = MenuCommon & {
  type: 'group';
  name: string;
  children: () => NormalMenu[];
};
type NormalMenu = MenuCommon &
  (
    | {
        type: 'action';
        name: string;
        isSelected?: boolean;
        label?: TemplateResult;
        icon?: TemplateResult;
        postfix?: TemplateResult;
        select: () => void;
        onHover?: (hover: boolean) => void;
        class?: string;
      }
    | {
        type: 'checkbox';
        name: string;
        checked: boolean;
        postfix?: TemplateResult;
        label?: TemplateResult;
        select: (checked: boolean) => boolean;
        class?: string;
      }
    | {
        type: 'sub-menu';
        name: string;
        label?: TemplateResult;
        icon?: TemplateResult;
        options: MenuOptions;
      }
  );
type Menu = GroupMenu | NormalMenu;
type GetMenuByType<T extends Menu['type'], M extends Menu = Menu> = M extends {
  type: T;
}
  ? M
  : never;
export type MenuOptions = {
  onComplete?: () => void;
  onClose?: () => void;
  input?: {
    search?: boolean;
    placeholder?: string;
    initValue?: string;
    onComplete?: (text: string) => void;
    left?: TemplateResult;
    right?: TemplateResult;
  };
  items: Menu[];
};

type Item = {
  select: () => void;
  label: TemplateResult;
  upDivider?: boolean;
  downDivider?: boolean;
  mouseEnter?: () => void;
  onHover?: (hover: boolean) => void;
  class?: string;
};

@customElement('affine-menu')
export class MenuComponent<_T> extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-menu {
      display: flex;
      flex-direction: column;
      user-select: none;
      min-width: 200px;
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      background-color: var(--affine-background-overlay-panel-color);
      padding: 8px;
      position: absolute;
      z-index: 999;
    }

    .affine-menu-header {
    }

    .affine-menu-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .affine-menu-header input {
      width: 100%;
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

    .affine-menu-divider {
      height: 0.5px;
      background: var(--affine-divider-color);
      margin: 7px 0;
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
  @property({ attribute: false })
  options!: MenuOptions;
  @state()
  private _text?: string;
  @state()
  private _selectedIndex?: number;
  private subMenu?: HTMLElement;
  private inputRef = createRef<HTMLInputElement>();
  private items!: Array<Item>;
  private _checked: Record<string, boolean> = {};

  private setChecked(name: string, checked: boolean) {
    this._checked[name] = checked;
    this.requestUpdate();
  }

  private getChecked(name: string): boolean {
    return this._checked[name];
  }

  private get minIndex() {
    return this.isSearchMode ? 0 : -1;
  }

  private get selectedIndex(): number {
    return this._selectedIndex ?? this.minIndex;
  }

  private set selectedIndex(index: number | undefined) {
    const old =
      this._selectedIndex != null ? this.items[this._selectedIndex] : undefined;
    old?.onHover?.(false);
    const newIndex = regularizationNumberInRange(
      index ?? this.minIndex,
      this.minIndex,
      this.items.length
    );
    this._selectedIndex = newIndex;
    this.items[newIndex]?.onHover?.(true);
  }

  private get text() {
    return this._text ?? this.options.input?.initValue ?? '';
  }

  private set text(value: string) {
    this._text = value;
  }

  private close() {
    this.options.onClose?.();
  }

  private _inputText = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    this.text = target.value;
  };

  override firstUpdated() {
    this.initTime = Date.now();
    const input = this.inputRef.value;
    if (input) {
      this.focusInput();
      const length = input.value.length;
      input.setSelectionRange(length, length);
      this._disposables.addFromEvent(input, 'keydown', e => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          this.close();
          return;
        }
        if (e.key === 'Enter') {
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
          this.selectedIndex = this.selectedIndex - 1;
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = this.selectedIndex + 1;
          return;
        }
      });
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.selectedItem?.onHover?.(false);
  }

  private show(item: Menu): boolean {
    if (this.isSearchMode) {
      if (!item.name.toLowerCase().includes(this.text.toLowerCase())) {
        return false;
      }
    }
    return !item.hide?.();
  }

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
          class: menu.class ?? (menu.isSelected ? 'selected-item' : ''),
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
          class: menu.class ?? '',
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
      const select = () => {
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
              autoPlacement({
                allowedPlacements: ['left-start', 'right-start'],
              }),
            ],
          }).then(({ x, y }) => {
            Object.assign(subMenu.style, {
              left: `${x}px`,
              top: `${y}px`,
            });
          });
          this.subMenu = subMenu;
        });
      };
      return [
        {
          label: html`${menu.icon
              ? html` <div class="icon">${menu.icon}</div>`
              : nothing}
            <div class="affine-menu-action-text">
              ${menu.label ?? menu.name}
            </div>
            <div
              class=""
              style="display:flex;align-items:center;transform: rotate(-90deg)"
            >
              ${ArrowDownIcon}
            </div>`,
          mouseEnter: select,
          select,
          class: '',
        },
      ];
    },
  };

  private process(menu: Menu): Item[] {
    if (this.show(menu)) {
      return this.processMap[menu.type](menu as never);
    } else {
      return [];
    }
  }

  private _complete = () => {
    this.options.onComplete?.();
    this.close();
  };

  private focusInput() {
    this.inputRef.value?.focus();
  }

  private _clickContainer = (e: MouseEvent) => {
    e.stopPropagation();
    this.focusInput();
  };

  private get selectedItem(): Item | undefined {
    return this.items[this.selectedIndex];
  }

  private _mouseEnter = (index: number) => {
    if (this._isConsciousChoice()) {
      return;
    }
    if (index !== this.selectedIndex) {
      this.selectedIndex = index;
      this.clearSubMenu();
      this.selectedItem?.mouseEnter?.();
    }
  };

  private initTime = 0;

  private _isConsciousChoice() {
    return Date.now() < this.initTime + 100;
  }

  private clearSubMenu() {
    this.subMenu?.remove();
    this.subMenu = undefined;
    this.focusInput();
  }

  mouseEnterHeader = () => {
    if (this.isSearchMode) {
      return;
    }
    this._mouseEnter(-1);
  };

  override render() {
    this.items = this.options.items.flatMap(item => this.process(item));
    this.selectedIndex = this._selectedIndex;
    const showHeader = this.showHeader();
    const headerStyle = styleMap({
      opacity: showHeader ? '1' : '0',
      height: showHeader ? undefined : '0',
      overflow: showHeader ? undefined : 'hidden',
    });
    return html`
      <div class="affine-menu" @click="${this._clickContainer}">
        ${this.options.input
          ? html` <div
                class="affine-menu-header"
                style=${headerStyle}
                @mouseenter="${this.mouseEnterHeader}"
              >
                <input
                  autocomplete="off"
                  ${ref(this.inputRef)}
                  type="text"
                  placeholder="${this.options.input?.placeholder ?? ''}"
                  value="${this.text ?? this.options.input?.initValue ?? ''}"
                  @input="${this._inputText}"
                />
              </div>
              ${this.items.length && showHeader
                ? html` <div class="affine-menu-divider"></div>`
                : null}`
          : null}
        <div class="affine-menu-body">
          ${this.items.length === 0 && this.isSearchMode
            ? html` <div class="no-results">No Results</div>`
            : ''}
          ${repeat(this.items, (menu, i) => {
            const divider = menu.upDivider || this.items[i - 1]?.downDivider;
            const mouseEnter = () => {
              this._mouseEnter(i);
            };
            const itemClass = menu.class ?? '';
            const classes = classMap({
              'affine-menu-action': true,
              selected: this._selectedIndex === i,
              [itemClass]: true,
            });
            return html`
              ${divider ? html` <div class="affine-menu-divider"></div>` : null}
              <div
                class="${classes}"
                @click="${menu.select}"
                @mouseenter="${mouseEnter}"
              >
                <div class="content">${menu.label}</div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  private showHeader() {
    return !this.isSearchMode || !!this.text;
  }

  private get isSearchMode() {
    return this.options.input?.search;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-menu': MenuComponent<unknown>;
  }
}
export const createModal = () => {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.left = '0';
  div.style.top = '0';
  div.style.width = '100vw';
  div.style.height = '100vh';
  div.style.zIndex = '1001';
  document.body.querySelector('block-suite-root')?.append(div);
  return div;
};
export const positionToVRect = (x: number, y: number): VirtualElement => {
  return {
    getBoundingClientRect(): ClientRectObject {
      return {
        x: x,
        y: y,
        width: 0,
        height: 0,
        top: y,
        bottom: y,
        left: x,
        right: x,
      };
    },
  };
};
export const eventToVRect = (e: MouseEvent): VirtualElement => {
  return positionToVRect(e.x, e.y);
};
export const createPopup = (
  target: ReferenceElement,
  content: HTMLElement,
  options?: {
    onClose?: () => void;
    middleware?: Array<Middleware | null | undefined | false>;
  }
) => {
  const modal = createModal();
  modal.append(content);
  computePosition(target, content, {
    middleware: options?.middleware ?? [
      autoPlacement({
        allowedPlacements: [
          'left-start',
          'right-start',
          'top-start',
          'bottom-start',
        ],
      }),
    ],
  }).then(({ x, y }) => {
    Object.assign(content.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });
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
  return () => {
    modal.remove();
  };
};

export const popMenu = <T>(
  target: ReferenceElement,
  props: {
    options: MenuOptions;
    middleware?: Array<Middleware | null | undefined | false>;
  }
) => {
  const menu = new MenuComponent<T>();
  menu.options = {
    ...props.options,
    onClose: () => {
      props.options.onClose?.();
      close();
    },
  };
  const close = createPopup(target, menu, {
    onClose: props.options.onClose,
    middleware: props.middleware,
  });
};
export const popFilterableSimpleMenu = (
  target: ReferenceElement,
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
