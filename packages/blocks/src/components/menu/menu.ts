import { ArrowDownIcon } from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Middleware } from '@floating-ui/dom';
import { autoPlacement, computePosition } from '@floating-ui/dom';
import type { TemplateResult } from 'lit';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';

import { regularizationNumberInRange } from '../../__internal__/utils/math.js';

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
        label?: TemplateResult;
        icon?: TemplateResult;
        select: () => void;
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
type MenuOptions = {
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
  class?: string;
};

@customElement('affine-menu')
export class MenuComponent<T> extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-menu {
      display: flex;
      flex-direction: column;
      user-select: none;
      min-width: 160px;
      box-shadow: var(--affine-shadow-2);
      border-radius: 4px;
      background-color: var(--affine-background-primary-color);
      padding: 2px 0;
      position: absolute;
      z-index: 999;
    }

    .affine-menu-header {
      padding: 4px 4px;
    }

    .affine-menu-header input {
      padding: 8px 8px;
      width: 100%;
      border-radius: 4px;
      border: 1px solid var(--affine-secondary-color);
      outline: none;
    }

    .affine-menu-divider {
      height: 0.5px;
      background: var(--affine-divider-color);
      margin: 2px 0;
    }

    .affine-menu-action {
      padding: 2px 4px;
      cursor: pointer;
    }

    .affine-menu-action svg {
      width: 20px;
      height: 20px;
      color: var(--affine-icon-color);
      fill: var(--affine-icon-color);
    }

    .affine-menu-action .icon {
      margin-right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .affine-menu-action .content {
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      justify-content: space-between;
      display: flex;
      align-items: center;
    }

    .affine-menu-action.selected .content {
      background-color: var(--affine-hover-color);
    }

    .affine-menu-action.selected.delete-item .content {
      background-color: var(--affine-background-error-color);
      color: var(--affine-error-color);
    }

    .affine-menu-action.selected.delete-item .icon > svg {
      fill: var(--affine-error-color);
    }

    .database-menu-component-action-button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  `;
  @property({ attribute: false })
  options!: MenuOptions;
  @state()
  private _text?: string;
  @state()
  private _selectedIndex = -1;
  private subMenu?: HTMLElement;
  private inputRef = createRef<HTMLInputElement>();
  private items!: Array<Item>;

  private get selectedIndex() {
    return this._selectedIndex;
  }

  private set selectedIndex(index: number) {
    this._selectedIndex = regularizationNumberInRange(
      index,
      -1,
      this.items.length
    );
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

  private show(item: Menu): boolean {
    if (this.options.input?.search) {
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
      return [
        {
          label: html` <div style="display: flex;align-items:center;">
            <div class="icon">${menu.icon}</div>
            ${menu.label ?? menu.name}
          </div>`,
          select: () => {
            menu.select();
            this._complete();
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
          label: html` <div style="display:flex;align-items:center;">
              <div class="icon">${menu.icon}</div>
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

  override render() {
    this.items = this.options.items.flatMap(item => this.process(item));
    this.selectedIndex = this._selectedIndex;
    return html`
      <div class="affine-menu" @click="${this._clickContainer}">
        ${this.options.input
          ? html` <div
                class="affine-menu-header"
                @mouseenter="${() => this._mouseEnter(-1)}"
              >
                <input
                  ${ref(this.inputRef)}
                  type="text"
                  placeholder="${this.options.input?.placeholder ?? ''}"
                  value="${this.text ?? this.options.input?.initValue ?? ''}"
                  @input="${this._inputText}"
                />
              </div>
              <div class="affine-menu-divider"></div>`
          : null}
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
    `;
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
  div.style.zIndex = '10';
  document.body.querySelector('editor-container')?.append(div);
  return div;
};
export const createPopup = (
  target: HTMLElement,
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
  modal.onclick = ev => {
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
  target: HTMLElement,
  props: {
    options: MenuOptions;
    container?: Element;
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
  target: HTMLElement,
  options: Menu[]
) => {
  popMenu(target, {
    options: {
      input: {
        placeholder: 'Search',
        search: true,
      },
      items: options,
    },
  });
};
