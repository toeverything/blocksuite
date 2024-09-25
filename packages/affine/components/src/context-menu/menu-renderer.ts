import type {
  ClientRectObject,
  Middleware,
  Placement,
  VirtualElement,
} from '@floating-ui/dom';

import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { autoUpdate, computePosition, shift } from '@floating-ui/dom';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
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
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      background-color: var(--affine-background-overlay-panel-color);
      padding: 8px;
      position: absolute;
      z-index: 999;
      gap: 4px;
    }

    .affine-menu-search {
      flex: 1;
      border-radius: 4px;
      outline: none;
      font-size: 14px;
      line-height: 22px;
      padding: 5px 12px;
      border: 1px solid var(--affine-border-color);
      width: 100%;
      margin-bottom: 8px;
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
      this._disposables.addFromEvent(input, 'keydown', e => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          this.menu.close();
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

      this._disposables.addFromEvent(input, 'copy', e => {
        e.stopPropagation();
      });
      this._disposables.addFromEvent(input, 'cut', e => {
        e.stopPropagation();
      });
    }
  }

  focusInput() {
    this.searchRef.value?.focus();
  }

  override render() {
    const showSearch =
      this.menu.isSearchMode && this.menu.searchName$.value.length > 0;
    const searchStyle = styleMap({
      opacity: showSearch ? '1' : '0',
      height: showSearch ? undefined : '0',
      overflow: showSearch ? undefined : 'hidden',
      position: showSearch ? undefined : 'absolute',
      pointerEvents: showSearch ? undefined : 'none',
    });
    return html`
      <div
        class="affine-menu"
        style=${ifDefined(this.menu.options.style)}
        @click="${this._clickContainer}"
      >
        <input
          autocomplete="off"
          class="affine-menu-search"
          data-1p-ignore
          ${ref(this.searchRef)}
          style=${searchStyle}
          type="text"
          value="${this.menu.searchName$.value}"
          @input="${(e: Event) =>
            (this.menu.searchName$.value = (
              e.target as HTMLInputElement
            ).value)}"
        />
        <div class="affine-menu-body">
          ${this.menu.searchResult$.value.length === 0 && this.menu.isSearchMode
            ? html` <div class="no-results">No Results</div>`
            : ''}
          ${this.menu.searchResult$.value}
        </div>
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
export const createPopup = (
  target: HTMLElement,
  content: HTMLElement,
  options?: {
    onClose?: () => void;
    middleware?: Array<Middleware | null | undefined | false>;
    placement?: Placement;
    container?: HTMLElement;
  }
) => {
  const modal = createModal(options?.container ?? getDefaultModalRoot(target));
  autoUpdate(target, content, () => {
    computePosition(target, content, {
      placement: options?.placement,
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

export const popMenu = (
  target: HTMLElement,
  props: {
    options: MenuOptions;
    placement?: Placement;
    middleware?: Array<Middleware | null | undefined | false>;
    container?: HTMLElement;
  }
): MenuHandler => {
  const menu = new Menu({
    ...props.options,
    onClose: () => {
      props.options.onClose?.();
      close();
    },
  });
  const close = createPopup(target, menu.menuElement, {
    onClose: props.options.onClose,
    middleware: props.middleware,
    container: props.container,
    placement: props.placement,
  });
  return {
    close,
  };
};
export const popFilterableSimpleMenu = (
  target: HTMLElement,
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
