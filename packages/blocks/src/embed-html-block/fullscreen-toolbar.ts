import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { popMenu } from '../_common/components/index.js';
import { SettingsIcon } from '../_common/icons/edgeless.js';
import { CopyIcon, ExpandCloseIcon } from '../_common/icons/text.js';
import type { EmbedHtmlBlockComponent } from './embed-html-block.js';

@customElement('embed-html-fullscreen-toolbar')
export class EmbedHtmlFullscreenToolbar extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      box-sizing: border-box;
      z-index: 1;
      left: calc(50%);
      transform: translateX(-50%);
      bottom: 0;
      -webkit-user-select: none;
      user-select: none;
    }

    .toolbar-toggle-control {
      padding-bottom: 28px;
    }

    .toolbar-toggle-control[data-hide='true'] {
      transition: 0.23s ease;
      padding-top: 100px;
      transform: translateY(100px);
    }

    .toolbar-toggle-control[data-hide='true']:hover {
      padding-top: 0;
      transform: translateY(0);
    }

    .fullscreen-toolbar-container {
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-menu-shadow);
      border: 1px solid var(--affine-border-color);
      border-radius: 40px;

      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;

      padding: 0 20px;

      height: 64px;

      -webkit-user-select: none;
      user-select: none;
    }

    .short-v-divider {
      display: inline-block;
      background-color: var(--affine-border-color);
      width: 1px;
      height: 36px;
      margin: 0 10px;
    }

    .fullscreen-toolbar-container .left,
    .fullscreen-toolbar-container .right {
      display: flex;
      gap: 8px;
    }

    .fullscreen-toolbar-container icon-button svg {
      width: 24px;
      height: 24px;
    }

    .fullscreen-toolbar-container icon-button.copy-button {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 7px;
      width: max-content;
      font-size: var(--affine-font-xs);
      & svg {
        width: 16px;
        height: 16px;
      }
    }
  `;

  @state()
  private accessor _hideToolbar = false;

  @state()
  private accessor _popperVisible = false;

  @property({ attribute: false })
  accessor embedHtml!: EmbedHtmlBlockComponent;

  @query('.fullscreen-toolbar-container')
  private accessor _fullScreenToolbarContainer!: HTMLElement;

  copyCode = () => {
    this.embedHtml.std.clipboard
      .writeToClipboard(items => {
        items['text/plain'] = this.embedHtml.model.html ?? '';
        return items;
      })
      .catch(console.error);
  };

  private _popSettings = () => {
    this._popperVisible = true;
    popMenu(this._fullScreenToolbarContainer, {
      options: {
        items: [
          {
            type: 'custom',
            render: html`<div class="settings-header">
              <span>Settings</span>
              <menu-divider></menu-divider>
            </div>`,
          },

          {
            type: 'group',
            name: 'thing',
            children: () => [
              {
                type: 'toggle-switch',
                name: 'Hide toolbar',
                on: this._hideToolbar,
                onChange: on => {
                  this._hideToolbar = on;
                },
              },
            ],
          },
        ],
        onClose: () => {
          this._popperVisible = false;
        },
      },

      placement: 'top-end',
      middleware: [flip(), offset({ mainAxis: 3, crossAxis: -40 })],
      container: this.embedHtml.iframeWrapper,
    });
  };

  override render() {
    const hideToolbar = !this._popperVisible && this._hideToolbar;

    return html`<div data-hide=${hideToolbar} class="toolbar-toggle-control">
      <div class="fullscreen-toolbar-container">
        <div class="left">
          <icon-button @click=${this.embedHtml.close}
            >${ExpandCloseIcon}</icon-button
          >
          <icon-button @click=${this._popSettings} ?hover=${this._popperVisible}
            >${SettingsIcon}</icon-button
          >
        </div>

        <div class="short-v-divider"></div>

        <div class="right">
          <icon-button
            class="copy-button"
            text="${'Copy Code'}"
            @click=${this.copyCode}
            >${CopyIcon}</icon-button
          >
        </div>
      </div>
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-html-fullscreen-toolbar': EmbedHtmlFullscreenToolbar;
  }
}
