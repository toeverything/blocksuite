import './ai-sub-item-list.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import { ArrowRightIcon, EnterIcon } from '../../icons/ai.js';
import { HoverController } from '../hover/controller.js';
import { menuItemStyles } from './styles.js';
import type { AIItemConfig } from './types.js';

@customElement('ai-item')
export class AIItem extends WithDisposable(LitElement) {
  static override styles = css`
    ${menuItemStyles}
  `;

  @property({ attribute: false })
  item!: AIItemConfig;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  onClick?: () => void;

  private _whenHover!: HoverController;

  constructor() {
    super();
    this._whenHover = new HoverController(this, ({ abortController }) => {
      return {
        template: html`<ai-sub-item-list
          .item=${this.item}
          .host=${this.host}
          .onClick=${this.onClick}
          .abortController=${abortController}
        ></ai-sub-item-list>`,
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
    const hasSubConfig = !!item.subItem && item.subItem.length > 0;
    const className = item.name.split(' ').join('-').toLocaleLowerCase();

    return html`<div
      class="menu-item ${className}"
      @pointerdown=${(e: MouseEvent) => e.stopPropagation()}
      @click=${() => {
        if (typeof item.handler === 'function') {
          item.handler(this.host);
        }
        this.onClick?.();
      }}
      ${hasSubConfig ? ref(this._whenHover.setReference) : ''}
    >
      <span class="item-icon">${item.icon}</span>
      <div class="item-name">
        ${item.name}${item.beta
          ? html`<div class="item-beta">(Beta)</div>`
          : nothing}
      </div>
      ${item.subItem
        ? html`<span class="arrow-right-icon">${ArrowRightIcon}</span>`
        : html`<span class="enter-icon">${EnterIcon}</span>`}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-item': AIItem;
  }
}
