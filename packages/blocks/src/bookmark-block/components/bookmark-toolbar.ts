import '../../components/button.js';

import { WithDisposable } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import * as Y from 'yjs';

import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import type { BookmarkBlockModel } from '../bookmark-model.js';
import { CaptionIcon, EditIcon, LinkIcon, MoreIcon } from '../images/icons.js';
import type {
  MenuActionCallback,
  OperationMenuPopper,
} from './bookmark-operation-popper.js';
import { createBookmarkOperationMenu } from './bookmark-operation-popper.js';
export type ConfigItem = {
  type: 'link' | 'edit' | 'caption';
  icon: TemplateResult;
  tooltip: string;
  action: (
    model: BaseBlockModel<BookmarkBlockModel>,
    callback?: ToolbarActionCallback,
    element?: HTMLElement
  ) => void;
  divider?: boolean;
};

export type ToolbarActionCallback = (type: ConfigItem['type']) => void;
const config: ConfigItem[] = [
  {
    type: 'link',
    icon: LinkIcon,
    tooltip: 'Turn into Link view',
    action: (model, callback) => {
      const { page } = model;

      const parent = page.getParent(model);
      const index = parent?.children.indexOf(model);

      const yText = new Y.Text();
      const insert = model.title || model.caption || model.url;
      yText.insert(0, insert);
      yText.format(0, insert.length, { link: model.url });
      const text = new page.Text(yText);
      page.addBlock(
        'affine:paragraph',
        {
          text,
        },
        parent,
        index
      );

      model.page.deleteBlock(model);
      callback?.('link');
    },
    divider: true,
  },
  {
    type: 'caption',
    icon: CaptionIcon,
    tooltip: 'Add Caption',
    action: (model, callback) => {
      callback?.('caption');
    },
  },
  {
    type: 'edit',
    icon: EditIcon,
    tooltip: 'Edit',
    action: (model, callback) => {
      callback?.('edit');
    },
    divider: true,
  },
];

@customElement('bookmark-toolbar')
export class BookmarkToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    ${tooltipStyle}
    .bookmark-bar {
      box-sizing: border-box;
      position: absolute;
      right: 0;
      top: -40px;
      display: flex;
      align-items: center;
      padding: 4px 8px;
      gap: 4px;
      height: 40px;

      border-radius: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      z-index: var(--affine-z-index-popover);
      user-select: none;
    }
    .divider {
      width: 1px;
      height: 24px;
      background-color: var(--affine-border-color);
    }
  `;

  @property()
  model!: BaseBlockModel;

  @property()
  onSelected?: ToolbarActionCallback & MenuActionCallback;

  @query('.bookmark-bar')
  formatQuickBarElement!: HTMLElement;

  @query('.more-button-wrapper')
  moreButton!: HTMLElement;

  private _menu: OperationMenuPopper | null = null;

  private _toggleMenu() {
    if (this._menu) {
      this._menu.dispose();
      this._menu = null;
    } else {
      this._menu = createBookmarkOperationMenu(this.moreButton, {
        model: this.model,
        onSelected: type => {
          this._toggleMenu();
          this.onSelected?.(type);
        },
      });
    }
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    const buttons = repeat(
      config,
      ({ type }) => type,
      ({ type, icon, tooltip, action, divider }) => {
        return html`<icon-button
            width="32px"
            height="32px"
            class="has-tool-tip ${type}"
            @click=${() => {
              action(this.model, this.onSelected, this);
            }}
          >
            ${icon}
            <tool-tip inert role="tooltip">${tooltip}</tool-tip>
          </icon-button>
          ${divider ? html`<div class="divider"></div>` : nothing} `;
      }
    );

    return html`
      <div class="bookmark-bar">
        ${buttons}

        <div class="more-button-wrapper">
          <icon-button
            width="32px"
            height="32px"
            class="has-tool-tip more-button"
            @click=${() => {
              this._toggleMenu();
            }}
          >
            ${MoreIcon}
            <tool-tip inert role="tooltip">More</tool-tip>
          </icon-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-toolbar': BookmarkToolbar;
  }
}
