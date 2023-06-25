import { ArrowDownIcon } from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Middleware } from '@floating-ui/dom';
import { autoPlacement, computePosition } from '@floating-ui/dom';
import type { TemplateResult } from 'lit';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';

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
      }
    | {
        type: 'sub-menu';
        name: string;
        label?: TemplateResult;
        icon?: TemplateResult;
        children: () => MenuOptions;
      }
  );
type Menu = GroupMenu | NormalMenu;
type MenuRenderData<T> = {
  value: T;
  change: (value: T) => void;
  complete: () => void;
};
type MenuListConfig = {
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
type MenuOptions<T = unknown> = {
  init: T;
  onComplete?: (value: T) => void;
  onClose?: () => void;
  render: (data: MenuRenderData<T>) => MenuListConfig;
};

@customElement('affine-menu')
export class MenuComponent<T> extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-menu {
      display: flex;
      flex-direction: column;
      user-select: none;
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

    .affine-menu-action:hover .content {
      background-color: var(--affine-hover-color);
    }

    .database-menu-component-action-button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  `;
  @property({ attribute: false })
  options!: MenuOptions<T>;
  @state()
  value?: T;
  @state()
  _text?: string;
  get text() {
    return this._text ?? this.config.input?.initValue ?? '';
  }

  set text(value: string) {
    this._text = value;
  }

  private close() {
    this.options.onClose?.();
    this.parentElement?.remove();
  }

  private _inputText = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    this.text = target.value;
  };
  private inputRef = createRef<HTMLInputElement>();
  private config!: MenuListConfig;

  override firstUpdated() {
    const input = this.inputRef.value;
    if (input) {
      input.focus();
      const length = input.value.length;
      input.setSelectionRange(length, length);
      this._disposables.addFromEvent(input, 'keydown', e => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          this.close();
          return;
        }
        if (e.key === 'Enter') {
          this.config.input?.onComplete?.(this.text);
          this._complete();
          return;
        }
      });
    }
  }

  show(item: Menu): boolean {
    if (this.config.input?.search) {
      if (!item.name.toLowerCase().includes(this.text.toLowerCase())) {
        return false;
      }
    }
    return !item.hide?.();
  }

  flat = (items: Menu[]) => {
    const result: Array<
      | NormalMenu
      | {
          type: 'divider';
        }
    > = [];
    items.forEach(item => {
      if (item.type === 'group') {
        if (!this.show(item)) {
          return;
        }
        const list = item.children().filter(item => !item.hide?.());
        if (list.length) {
          if (result[result.length - 1]?.type !== 'divider') {
            result.push({ type: 'divider' });
          }
          result.push(...list, { type: 'divider' });
        }
      } else if (this.show(item)) {
        result.push(item);
      }
    });
    if (result[result.length - 1]?.type === 'divider') {
      result.pop();
    }
    return result;
  };

  private _complete = () => {
    this.options.onComplete?.(this.value ?? this.options.init);
    this.close();
  };
  private _clickContainer = (e: MouseEvent) => {
    e.stopPropagation();
    this.inputRef.value?.focus();
  };

  override render() {
    this.config = this.options.render({
      value: this.value ?? this.options.init,
      change: (value: T) => {
        this.value = value;
      },
      complete: this._complete,
    });

    return html`
      <div class="affine-menu" @click="${this._clickContainer}">
        <div class="affine-menu-header">
          <input
            ${ref(this.inputRef)}
            type="text"
            placeholder="${this.config.input?.placeholder ?? ''}"
            value="${this.text ?? this.config.input?.initValue ?? ''}"
            @input="${this._inputText}"
          />
        </div>
        <div class="affine-menu-divider"></div>
        ${repeat(this.flat(this.config.items), menu => {
          if (menu.type === 'divider') {
            return html` <div class="affine-menu-divider"></div>`;
          }
          if (menu.type === 'action') {
            const click = () => {
              menu.select();
              this._complete();
            };
            return html` <div
              class="affine-menu-action affine-menu-action"
              @click="${click}"
            >
              <div class="content">
                <div style="display: flex;align-items:center;">
                  <div class="icon">${menu.icon}</div>
                  ${menu.label ?? menu.name}
                </div>
              </div>
            </div>`;
          }
          if (menu.type === 'sub-menu') {
            return html` <div class="affine-menu-sub-menu affine-menu-action">
              <div class="content">
                <div style="display:flex;align-items:center;">
                  <div class="icon">${menu.icon}</div>
                  ${menu.label ?? menu.name}
                </div>
                <div
                  class=""
                  style="display:flex;align-items:center;transform: rotate(-90deg)"
                >
                  ${ArrowDownIcon}
                </div>
              </div>
            </div>`;
          }
          return '';
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
    options: MenuOptions<T>;
    container?: Element;
  }
) => {
  const menu = new MenuComponent<T>();
  menu.options = props.options;
  createPopup(target, menu, {
    onClose: props.options.onClose,
  });
};
export const popFilterableSimpleMenu = (
  target: HTMLElement,
  options: Menu[]
) => {
  popMenu(target, {
    options: {
      init: {},
      render: () => {
        return {
          input: {
            placeholder: 'Search',
            search: true,
          },
          items: options,
        };
      },
    },
  });
};
