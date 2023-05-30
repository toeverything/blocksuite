import { WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { toast } from '../..//components/toast.js';
import { copyBlocks } from '../../__internal__/clipboard/index.js';
import { getBlockElementByModel } from '../../__internal__/index.js';
import type { BookmarkBlockComponent } from '../bookmark-block.js';
import type { BookmarkBlockModel } from '../bookmark-model.js';
import {
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  RefreshIcon,
} from '../images/icons.js';
import { cloneBookmarkProperties, reloadBookmarkBlock } from '../utils.js';

export type OperationMenuPopper = {
  element: BookmarkOperationMenu;
  dispose: () => void;
};

export function createBookmarkOperationMenu(
  reference: HTMLElement,
  props: {
    model: BaseBlockModel<BookmarkBlockModel>;
    onSelected?: MenuActionCallback;
  }
): OperationMenuPopper {
  const menu = document.createElement('bookmark-operation-menu');
  menu.model = props.model;
  menu.onSelected = props.onSelected;

  reference.appendChild(menu);
  const popper = createPopper(reference, menu, {
    placement: 'top-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 6],
        },
      },
    ],
  });

  return {
    element: menu,
    dispose: () => {
      menu.remove();
      popper.destroy();
    },
  };
}

export type MenuActionCallback = (type: Operation['type']) => void;

type Operation = {
  type: 'reload' | 'copy' | 'delete' | 'duplicate';
  icon: TemplateResult;
  label: string;
  action: (
    model: BaseBlockModel<BookmarkBlockModel>,
    callback?: MenuActionCallback,
    element?: HTMLElement
  ) => void;
  divider?: boolean;
};
const operations: Operation[] = [
  {
    type: 'copy',
    icon: CopyIcon,
    label: 'Copy',
    action: (model, callback) => {
      copyBlocks({
        type: 'Block',
        models: [model],
        startOffset: 0,
        endOffset: 0,
      });
      toast('Copied Database to clipboard');
      callback?.('copy');
    },
  },
  {
    type: 'duplicate',
    icon: DuplicateIcon,
    label: 'Duplicate',
    action: (model, callback) => {
      const { page } = model;

      const parent = page.getParent(model);
      const index = parent?.children.indexOf(model);

      const clonedProps = cloneBookmarkProperties(model);

      page.addBlock('affine:bookmark', clonedProps, parent, index);

      callback?.('duplicate');
    },
  },
  {
    type: 'reload',
    icon: RefreshIcon,
    label: 'Reload',
    action: (model, callback) => {
      reloadBookmarkBlock(
        model,
        getBlockElementByModel(model) as BookmarkBlockComponent,
        true
      );
      callback?.('reload');
    },
  },
  {
    type: 'delete',
    icon: DeleteIcon,
    label: 'Delete',
    action: (model, callback) => {
      model.page.deleteBlock(model);
      callback?.('delete');
    },
  },
];

@customElement('bookmark-operation-menu')
export class BookmarkOperationMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .bookmark-operation-menu {
      border-radius: 8px 8px 8px 0;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
    }
    .menu-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      fill: var(--affine-icon-color);
      color: var(--affine-text-primary-color);
    }
    .menu-item:hover {
      background: var(--affine-hover-color);
      fill: var(--affine-primary-color);
      color: var(--affine-primary-color);
    }
    .menu-item svg {
      margin: 0 8px;
    }
  `;

  @property()
  model!: BaseBlockModel;

  @property()
  root!: BookmarkBlockComponent;

  @property()
  onSelected?: MenuActionCallback;

  @query('.bookmark-bar')
  formatQuickBarElement!: HTMLElement;

  override connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    const menuItems = repeat(
      operations,
      ({ type }) => type,
      ({ type, icon, label, action, divider }) => {
        return html`<icon-button
            width="130px"
            height="32px"
            class="menu-item ${type}"
            @click=${() => {
              action(this.model, this.onSelected, this);
            }}
          >
            ${icon} ${label}
          </icon-button>
          ${divider ? html`<div class="divider"></div>` : nothing} `;
      }
    );

    return html` <div class="bookmark-operation-menu">${menuItems}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-operation-menu': BookmarkOperationMenu;
  }
}
