import { unsafeCSSVar, unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { ArrowLeftBigIcon, CloseIcon, SearchIcon } from '@blocksuite/icons/lit';
import {
  autoPlacement,
  autoUpdate,
  computePosition,
  type Middleware,
  offset,
  type ReferenceElement,
  shift,
} from '@floating-ui/dom';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

import { Menu, type MenuConfig, type MenuOptions } from './menu.js';

export class MenuComponent extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    affine-menu {
      font-family: var(--affine-font-family);
      display: flex;
      flex-direction: column;
      user-select: none;
      min-width: 276px;
      box-shadow: ${unsafeCSSVar('overlayPanelShadow')};
      border-radius: 4px;
      background-color: ${unsafeCSSVarV2('layer/background/overlayPanel')};
      padding: 8px;
      position: absolute;
      z-index: 999;
      gap: 8px;
      border: 0.5px solid ${unsafeCSSVarV2('layer/insideBorder/border')};
    }

    .affine-menu-search-container {
      border-radius: 4px;
      display: flex;
      align-items: center;
      padding: 4px 10px;
      gap: 8px;
      border: 1px solid ${unsafeCSSVarV2('input/border/default')};
    }

    .affine-menu-search {
      flex: 1;
      outline: none;
      font-size: 14px;
      line-height: 22px;
      border: none;
      background-color: transparent;
    }

    .affine-menu-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
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
  `;

  private _clickContainer = (e: MouseEvent) => {
    e.stopPropagation();
    this.focusInput();
    this.menu.closeSubMenu();
  };

  private searchRef = createRef<HTMLInputElement>();

  override firstUpdated() {
    const input = this.searchRef.value;
    if (input) {
      requestAnimationFrame(() => {
        this.focusInput();
      });
      const length = input.value.length;
      input.setSelectionRange(length, length);
      this.disposables.addFromEvent(input, 'keydown', e => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          this.menu.close();
          return;
        }
        const onBack = this.menu.options.title?.onBack;
        if (e.key === 'Backspace' && onBack && !this.menu.showSearch$.value) {
          this.menu.close();
          onBack(this.menu);
          return;
        }
        if (e.key === 'Enter' && !e.isComposing) {
          this.menu.pressEnter();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.menu.focusPrev();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.menu.focusNext();
          return;
        }
      });

      this.disposables.addFromEvent(input, 'copy', e => {
        e.stopPropagation();
      });
      this.disposables.addFromEvent(input, 'cut', e => {
        e.stopPropagation();
      });
      this.disposables.addFromEvent(this, 'click', this._clickContainer);
    }
  }

  focusInput() {
    this.searchRef.value?.focus();
  }

  override render() {
    return html`
      ${this.renderTitle()} ${this.renderSearch()}
      <div class="affine-menu-body">
        ${this.menu.searchResult$.value.length === 0 && this.menu.enableSearch
          ? html` <div class="no-results">No Results</div>`
          : ''}
        ${this.menu.searchResult$.value}
      </div>
    `;
  }

  renderSearch() {
    const config = this.menu.options.search;
    const showSearch = this.menu.showSearch$.value || config?.placeholder;
    const searchStyle = styleMap({
      opacity: showSearch ? '1' : '0',
      height: showSearch ? undefined : '0',
      overflow: showSearch ? undefined : 'hidden',
      position: showSearch ? undefined : 'absolute',
      pointerEvents: showSearch ? undefined : 'none',
    });
    return html` <div style=${searchStyle} class="affine-menu-search-container">
      <div
        style="font-size:20px;display:flex;align-items:center;color: var(--affine-text-secondary-color)"
      >
        ${SearchIcon()}
      </div>
      <input
        autocomplete="off"
        class="affine-menu-search"
        placeholder="${config?.placeholder ?? ''}"
        data-1p-ignore
        ${ref(this.searchRef)}
        type="text"
        value="${this.menu.searchName$.value}"
        @input="${(e: Event) =>
          (this.menu.searchName$.value = (e.target as HTMLInputElement).value)}"
      />
    </div>`;
  }

  renderTitle() {
    const title = this.menu.options.title;
    if (!title) {
      return;
    }
    return html`
      <div
        style="display:flex;align-items:center;gap: 4px;min-width: 300px;padding:3px 4px 3px 2px"
        @mouseenter="${() => this.menu.closeSubMenu()}"
      >
        ${title.onBack
          ? html` <div
              @click="${() => {
                title.onBack?.(this.menu);
                this.menu.close();
              }}"
              class="dv-icon-20 dv-hover dv-pd-2 dv-round-4"
              style="display:flex;"
            >
              ${ArrowLeftBigIcon()}
            </div>`
          : nothing}
        <div
          style="flex:1;font-weight:500;font-size: 14px;line-height: 22px;color: var(--affine-text-primary-color)"
        >
          ${title.text}
        </div>
        ${title.postfix?.()}
        ${title.onClose
          ? html` <div
              @click="${title.onClose}"
              class="dv-icon-20 dv-hover dv-pd-2 dv-round-4"
              style="display:flex;"
            >
              ${CloseIcon()}
            </div>`
          : nothing}
      </div>
    `;
  }

  @property({ attribute: false })
  accessor menu!: Menu;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-menu': MenuComponent;
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
export type PopupTarget = {
  targetRect: ReferenceElement;
  root: HTMLElement;
  button: HTMLElement;
};
export const popupTargetFromElement = (element: HTMLElement): PopupTarget => {
  let rect = element.getBoundingClientRect();
  return {
    targetRect: {
      getBoundingClientRect: () => {
        if (element.isConnected) {
          return (rect = element.getBoundingClientRect());
        }
        return rect;
      },
    },
    root: getDefaultModalRoot(element),
    button: element,
  };
};
export const createPopup = (
  target: PopupTarget,
  content: HTMLElement,
  options?: {
    onClose?: () => void;
    middleware?: Array<Middleware | null | undefined | false>;
    container?: HTMLElement;
  }
) => {
  const close = () => {
    modal.remove();
    options?.onClose?.();
  };
  const modal = createModal(target.root);
  autoUpdate(target.targetRect, content, () => {
    computePosition(target.targetRect, content, {
      middleware: options?.middleware ?? [shift({ crossAxis: true })],
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
      close();
    }
  };

  modal.oncontextmenu = ev => {
    ev.preventDefault();
    if (ev.target === modal) {
      close();
    }
  };

  return close;
};

export type MenuHandler = {
  close: () => void;
};

export const popMenu = (
  target: PopupTarget,
  props: {
    options: MenuOptions;
    middleware?: Array<Middleware | null | undefined | false>;
    container?: HTMLElement;
  }
): MenuHandler => {
  const classList = target.button.classList;
  const hasActive = classList.contains('active');
  if (!hasActive) {
    classList.add('active');
  }
  const onClose = () => {
    props.options.onClose?.();
    if (!hasActive) {
      classList.remove('active');
    }
  };
  const menu = new Menu({
    ...props.options,
    onClose: () => {
      closePopup();
    },
  });
  const closePopup = createPopup(target, menu.menuElement, {
    onClose: onClose,
    middleware: props.middleware ?? [
      autoPlacement({
        allowedPlacements: [
          'bottom-start',
          'bottom-end',
          'top-start',
          'top-end',
        ],
      }),
      offset(4),
    ],
    container: props.container,
  });
  return {
    close: closePopup,
  };
};
export const popFilterableSimpleMenu = (
  target: PopupTarget,
  options: MenuConfig[],
  onClose?: () => void
) => {
  popMenu(target, {
    options: {
      items: options,
      onClose,
    },
  });
};
