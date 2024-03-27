import './ai-action-sub-menu.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import { ArrowRightIcon, EnterIcon } from '../../icons/ai.js';
import { HoverController } from '../hover/controller.js';
import { actionItemStyles } from './ai-action-sub-menu.js';
import { type AIActionConfigItem } from './config.js';

@customElement('ai-action-item')
export class AIActionItem extends WithDisposable(LitElement) {
  static override styles = css`
    ${actionItemStyles}
  `;

  @property({ attribute: false })
  item!: AIActionConfigItem;

  @property({ attribute: false })
  host!: EditorHost;

  private _whenHover!: HoverController;

  constructor() {
    super();
    this._whenHover = new HoverController(this, ({ abortController }) => {
      return {
        template: html`<ai-action-sub-menu
          .item=${this.item}
          .host=${this.host}
          .abortController=${abortController}
        ></ai-action-sub-menu>`,
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
      class="action-item"
      @click=${() => typeof item.action === 'function' && item.action()}
      ${hasSubConfig ? ref(this._whenHover.setReference) : ''}
    >
      <span class="action-icon">${item.icon}</span>
      <div class="action-name">${item.name}</div>
      ${item.subConfig
        ? html`<span class="arrow-right-icon">${ArrowRightIcon}</span>`
        : html`<span class="enter-icon">${EnterIcon}</span>`}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-action-item': AIActionItem;
  }
}
