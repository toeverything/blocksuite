import { WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { toast } from '../..//components/toast.js';
import { copyBlocks } from '../../__internal__/clipboard/utils/commons.js';
import { getBlockElementByModel } from '../../__internal__/index.js';
import {
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  RefreshIcon,
} from '../../icons/index.js';
import type { BookmarkBlockComponent } from '../bookmark-block.js';
import type { BookmarkBlockModel } from '../bookmark-model.js';
import {
  cloneBookmarkProperties,
  reloadBookmarkBlock,
  tryGetBookmarkAPI,
} from '../utils.js';

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
  showWhen?: (model: BaseBlockModel<BookmarkBlockModel>) => boolean;
  disableWhen?: (model: BaseBlockModel<BookmarkBlockModel>) => boolean;
  divider?: boolean;
};
const operations: Operation[] = [
  {
    type: 'copy',
    icon: CopyIcon,
    label: 'Copy',
    action: async (model, callback) => {
      await copyBlocks([model]);
      toast('Copied link to clipboard');
      callback?.('copy');
    },
  },
  {
    type: 'duplicate',
    icon: DuplicateIcon,
    label: 'Duplicate',
    disableWhen: model => model.page.readonly,
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
    disableWhen: model => !tryGetBookmarkAPI() || model.page.readonly,
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
    disableWhen: model => model.page.readonly,
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
      border-radius: 8px;
      padding: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }
    .menu-item {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
    .menu-item:hover {
      background: var(--affine-hover-color);
    }
    .menu-item:hover.delete {
      background: var(--affine-background-error-color);
      fill: var(--affine-error-color);
      color: var(--affine-error-color);
    }
    .menu-item svg {
      margin: 0 8px;
    }
  `;

  @property({ attribute: false })
  model!: BaseBlockModel;

  @property({ attribute: false })
  onSelected?: MenuActionCallback;

  override connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    const menuItems = repeat(
      operations.filter(({ showWhen = () => true }) => showWhen(this.model)),
      ({ type }) => type,
      ({ type, icon, label, action, divider, disableWhen = () => false }) => {
        return html`<icon-button
            width="126px"
            height="32px"
            class="menu-item ${type}"
            text=${label}
            ?disabled=${disableWhen(this.model)}
            @click=${() => {
              action(this.model, this.onSelected, this);
            }}
          >
            ${icon}
          </icon-button>
          ${divider ? html`<div class="divider"></div>` : nothing} `;
      }
    );

    return html`<div class="bookmark-operation-menu">${menuItems}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-operation-menu': BookmarkOperationMenu;
  }
}
