import './ai-sub-menu.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import { ArrowRightIcon, EnterIcon } from '../../icons/ai.js';
import { HoverController } from '../hover/controller.js';
import { menuItemStyles } from './ai-sub-menu.js';
import { type AIMenuConfigItem } from './config.js';

@customElement('ai-menu-item')
export class AIMenuItem extends WithDisposable(LitElement) {
  static override styles = css`
    ${menuItemStyles}
  `;

  @property({ attribute: false })
  item!: AIMenuConfigItem;

  @property({ attribute: false })
  host!: EditorHost;

  private _whenHover!: HoverController;

  constructor() {
    super();
    this._whenHover = new HoverController(this, ({ abortController }) => {
      return {
        template: html`<ai-sub-menu
          .item=${this.item}
          .host=${this.host}
          .abortController=${abortController}
        ></ai-sub-menu>`,
        computePosition: {
          referenceElement: this,
          placement: 'right-start',
          middleware: [flip(), offset({ mainAxis: 16, crossAxis: -60 })],
          autoUpdate: {
            ancestorScroll: false,
            ancestorResize: false,
            elementResize: false,
            layoutShift: false,
            animationFrame: false,
          },
        },
      };
    });
  }

  override render() {
    const { item } = this;
    const hasSubConfig = !!item.subConfig && item.subConfig.length > 0;
    return html`<div
      class="menu-item"
      @click=${() => typeof item.handler === 'function' && item.handler()}
      ${hasSubConfig ? ref(this._whenHover.setReference) : ''}
    >
      <span class="item-icon">${item.icon}</span>
      <div class="item-name">${item.name}</div>
      ${item.subConfig
        ? html`<span class="arrow-right-icon">${ArrowRightIcon}</span>`
        : html`<span class="enter-icon">${EnterIcon}</span>`}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-menu-item': AIMenuItem;
  }
}
