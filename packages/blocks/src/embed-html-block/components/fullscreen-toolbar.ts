import { flip, offset } from '@floating-ui/dom';
import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import type { EmbedHtmlBlockComponent } from '../embed-html-block.js';

import { popMenu } from '../../_common/components/index.js';
import { SettingsIcon } from '../../_common/icons/edgeless.js';
import { CopyIcon, ExpandCloseIcon } from '../../_common/icons/text.js';
import { DoneIcon } from './../../_common/icons/index.js';

@customElement('embed-html-fullscreen-toolbar')
export class EmbedHtmlFullscreenToolbar extends LitElement {
  static override styles = css`
    :host {
      box-sizing: border-box;
      position: absolute;
      z-index: 1;
      left: 50%;
      transform: translateX(-50%);
      bottom: 0;
      -webkit-user-select: none;
      user-select: none;
    }

    .toolbar-toggle-control {
      padding-bottom: 20px;
    }

    .toolbar-toggle-control[data-auto-hide='true'] {
      transition: 0.27s ease;
      padding-top: 100px;
      transform: translateY(100px);
    }

    .toolbar-toggle-control[data-auto-hide='true']:hover {
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
    }

    .short-v-divider {
      display: inline-block;
      background-color: var(--affine-border-color);
      width: 1px;
      height: 36px;
    }
  `;

  private _popSettings = () => {
    this._popperVisible = true;
    popMenu(this._fullScreenToolbarContainer, {
      container: this.embedHtml.iframeWrapper,

      middleware: [flip(), offset({ crossAxis: -40, mainAxis: 4 })],
      options: {
        items: [
          {
            render: html`<div class="settings-header">
              <span>Settings</span>
            </div>`,
            type: 'custom',
          },

          {
            children: () => [
              {
                name: 'Hide toolbar',
                on: this.autoHideToolbar,
                onChange: on => {
                  this.autoHideToolbar = on;
                },
                type: 'toggle-switch',
              },
            ],
            name: 'thing',
            type: 'group',
          },
        ],
        onClose: () => {
          this._popperVisible = false;
        },
      },
      placement: 'top-end',
    });
  };

  copyCode = () => {
    if (this._copied) return;

    this.embedHtml.std.clipboard
      .writeToClipboard(items => {
        items['text/plain'] = this.embedHtml.model.html ?? '';
        return items;
      })
      .then(() => {
        this._copied = true;
        setTimeout(() => (this._copied = false), 1500);
      })
      .catch(console.error);
  };

  private get autoHideToolbar() {
    return (
      this.embedHtml.edgeless?.service.editPropsStore.getStorage(
        'autoHideEmbedHTMLFullScreenToolbar'
      ) ?? false
    );
  }

  private set autoHideToolbar(val: boolean) {
    this.embedHtml.edgeless?.service.editPropsStore.setStorage(
      'autoHideEmbedHTMLFullScreenToolbar',
      val
    );
  }

  override render() {
    const hideToolbar = !this._popperVisible && this.autoHideToolbar;

    return html`<div
      data-auto-hide=${hideToolbar}
      class="toolbar-toggle-control"
    >
      <div class="fullscreen-toolbar-container">
        <icon-button @click=${this.embedHtml.close}
          >${ExpandCloseIcon}</icon-button
        >
        <icon-button @click=${this._popSettings} hover=${this._popperVisible}
          >${SettingsIcon}</icon-button
        >

        <div class="short-v-divider"></div>

        <icon-button class="copy-button" @click=${this.copyCode}
          >${this._copied ? DoneIcon : CopyIcon}
        </icon-button>
      </div>
    </div> `;
  }

  @state()
  private accessor _copied = false;

  @query('.fullscreen-toolbar-container')
  private accessor _fullScreenToolbarContainer!: HTMLElement;

  @state()
  private accessor _popperVisible = false;

  @property({ attribute: false })
  accessor embedHtml!: EmbedHtmlBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-html-fullscreen-toolbar': EmbedHtmlFullscreenToolbar;
  }
}
