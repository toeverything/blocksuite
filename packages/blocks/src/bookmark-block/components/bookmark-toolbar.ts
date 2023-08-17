import '../../components/button.js';

import { Slot } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
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
      const insert = model.bookmarkTitle || model.caption || model.url;
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
    action: (_model, callback) => {
      callback?.('caption');
    },
  },
  {
    type: 'edit',
    icon: EditIcon,
    tooltip: 'Edit',
    action: (_model, callback) => {
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
      position: fixed;
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

  @property({ attribute: false })
  model!: BaseBlockModel;

  @property({ attribute: false })
  onSelected?: ToolbarActionCallback & MenuActionCallback;

  @property({ attribute: false })
  root!: HTMLElement;

  @property({ attribute: false })
  private toolbarHoverStateSlot = new Slot<{
    inBookmark?: boolean;
    inToolbar?: boolean;
  }>();

  @query('.bookmark-bar')
  formatQuickBarElement!: HTMLElement;

  @query('.more-button-wrapper')
  moreButton!: HTMLElement;

  private _menu: OperationMenuPopper | null = null;
  private _timer: ReturnType<typeof setTimeout> | null = null;

  @state()
  private _position: { x: number; y: number } = { x: 0, y: 0 };
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

  private _calculatePosition() {
    const { right, top } = this.root.getBoundingClientRect();
    const { width, height } =
      this.formatQuickBarElement.getBoundingClientRect();

    this._position = { x: right - width, y: top - height };
  }

  private _onHover() {
    this._timer && clearTimeout(this._timer);
    this.toolbarHoverStateSlot.emit({ inToolbar: true });
  }

  private _onHoverOut() {
    this._timer = setTimeout(() => {
      this.toolbarHoverStateSlot.emit({ inToolbar: false });
    }, 100);
  }

  override connectedCallback() {
    super.connectedCallback();

    requestAnimationFrame(() => {
      this._calculatePosition();
    });
  }

  override render() {
    const buttons = repeat(
      config,
      ({ type }) => type,
      ({ type, icon, tooltip, action, divider }) => {
        return html`<icon-button
            width="32px"
            height="32px"
            class="bookmark-toolbar-button has-tool-tip ${type}"
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
      <div
        class="bookmark-bar"
        style="left:${this._position.x}px;top:${this._position.y}px"
        @mouseover="${this._onHover}"
        @mouseout="${this._onHoverOut}"
      >
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
