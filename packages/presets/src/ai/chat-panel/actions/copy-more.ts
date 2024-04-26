import type {
  BlockSelection,
  EditorHost,
  TextSelection,
} from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { createButtonPopper } from '@blocksuite/blocks';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { CopyIcon, MoreIcon } from '../../_common/icons.js';
import { copyText } from '../../utils/editor-actions.js';
import { PageEditorActions } from './actions-handle.js';

@customElement('chat-copy-more')
export class ChatCopyMore extends WithDisposable(LitElement) {
  static override styles = css`
    .copy-more {
      display: flex;
      gap: 8px;
      height: 36px;
      justify-content: flex-end;
      align-items: center;
      margin-top: 8px;
      margin-bottom: 12px;

      div {
        cursor: pointer;
      }
    }

    .more-menu {
      width: 226px;
      border-radius: 8px;
      background-color: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-menu-shadow);
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: absolute;
      z-index: 1;
      user-select: none;

      > div {
        height: 30px;
        display: flex;
        gap: 8px;
        align-items: center;
        cursor: pointer;

        svg {
          margin-left: 12px;
        }
      }

      > div:hover {
        background-color: var(--affine-hover-color);
      }
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  content!: string;

  @property({ attribute: false })
  isLast!: boolean;

  @property({ attribute: false })
  curTextSelection?: TextSelection;

  @property({ attribute: false })
  curBlockSelections?: BlockSelection[];

  @state()
  private _showMoreMenu = false;

  @query('.more-button')
  private _moreButton!: HTMLDivElement;
  @query('.more-menu')
  private _moreMenu!: HTMLDivElement;
  private _morePopper: ReturnType<typeof createButtonPopper> | null = null;

  private _toggle() {
    this._morePopper?.toggle();
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('isLast')) {
      if (this.isLast) {
        this._morePopper?.dispose();
        this._morePopper = null;
      } else if (!this._morePopper) {
        this._morePopper = createButtonPopper(
          this._moreButton,
          this._moreMenu,
          ({ display }) => (this._showMoreMenu = display === 'show')
        );
      }
    }
  }

  override render() {
    const { host, content, isLast } = this;
    return html`<style>
        .more-menu {
          padding: ${this._showMoreMenu ? '8px' : '0px'};
        }
      </style>
      <div class="copy-more">
        <div @click=${() => copyText(host, content)}>${CopyIcon}</div>
        ${isLast
          ? nothing
          : html`<div class="more-button" @click=${this._toggle}>
              ${MoreIcon}
            </div> `}
      </div>

      <div class="more-menu">
        ${this._showMoreMenu
          ? repeat(
              PageEditorActions,
              action => action.title,
              action => {
                return html`<div
                  @click=${() =>
                    action.handler(
                      host,
                      content,
                      this.curTextSelection,
                      this.curBlockSelections
                    )}
                >
                  ${action.icon}
                  <div>${action.title}</div>
                </div>`;
              }
            )
          : nothing}
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-copy-more': ChatCopyMore;
  }
}
