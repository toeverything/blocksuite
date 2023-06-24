import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { autoPlacement, computePosition } from '@floating-ui/dom';
import type { TemplateResult } from 'lit';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';

import { onClickOutside } from '../../database-block/utils/utils.js';

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
        children: <T>() => MenuOptions<T>;
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
  render: (data: MenuRenderData<T>) => MenuListConfig;
};

@customElement('affine-menu')
export class MenuComponent<T> extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-menu {
      display: flex;
      flex-direction: column;
      user-select: none;
      box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      background-color: white;
      padding: 4px 0;
      position: absolute;
      z-index: 999;
    }

    .affine-menu-header {
      padding: 4px 8px;
    }

    affine-menu-header input {
    }

    .affine-menu-divider {
      height: 0.5px;
      background: var(--affine-divider-color);
      margin: 8px 0;
    }

    .affine-menu-action {
      height: 32px;
      padding: 4px 8px;
      cursor: pointer;
    }

    .affine-menu-action svg {
      width: 20px;
      height: 20px;
      color: var(--affine-icon-color);
      fill: var(--affine-icon-color);
    }

    .affine-menu-action .content {
      padding: 2px 4px;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      display: flex;
      justify-content: space-between;
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
          this.remove();
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

  flat = (items: Menu[]) => {
    const result: Array<NormalMenu | { type: 'divider' }> = [];
    items.forEach(item => {
      if (item.type === 'group') {
        if (item.hide?.()) {
          return;
        }
        const list = item.children().filter(item => !item.hide?.());
        if (list.length) {
          if (result[result.length - 1].type !== 'divider') {
            result.push({ type: 'divider' });
          }
          result.push(...list, { type: 'divider' });
        }
      } else {
        result.push(item);
      }
    });
    if (result[result.length - 1].type === 'divider') {
      result.pop();
    }
    return result;
  };

  private _complete = () => {
    this.options.onComplete?.(this.value ?? this.options.init);
    this.remove();
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
      <div class="affine-menu">
        <div class="affine-menu-header">
          <input
            ${ref(this.inputRef)}
            type="text"
            placeholder="${this.config.input?.placeholder}"
            value="${this.text ?? this.config.input?.initValue ?? ''}"
            @input="${this._inputText}"
          />
        </div>
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
              <div class="content">${menu.icon} ${menu.label ?? menu.name}</div>
            </div>`;
          }
          if (menu.type === 'sub-menu') {
            return html` <div class="affine-menu-sub-menu affine-menu-action">
              <div class="content">${menu.icon} ${menu.label ?? menu.name}</div>
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

export const createPopup = (
  target: HTMLElement,
  content: HTMLElement,
  options?: {
    onClose?: () => void;
  }
) => {
  target.parentElement?.append(content);
  computePosition(target, content, {
    middleware: [autoPlacement()],
  }).then(({ x, y }) => {
    Object.assign(content.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  });
  onClickOutside(
    content,
    () => {
      content.remove();
      options?.onClose?.();
    },
    'mousedown'
  );
};

export const popMenu = <T>(
  target: HTMLElement,
  props: {
    options: MenuOptions<T>;
  }
) => {
  const menu = new MenuComponent<T>();
  menu.options = props.options;
  createPopup(target, menu);
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
            placeholder: '',
          },
          items: options,
        };
      },
    },
  });
};
