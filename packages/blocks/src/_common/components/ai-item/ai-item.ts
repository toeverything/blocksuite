import './ai-sub-item-list.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { flip, offset } from '@floating-ui/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
} from '../../../root-block/index.js';
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

  private _whenHover!: HoverController;

  constructor() {
    super();
    this._whenHover = new HoverController(this, ({ abortController }) => {
      return {
        template: html`<ai-sub-item-list
          .item=${this.item}
          .host=${this.host}
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

    const rootBlockId = this.host.doc.root?.id;
    assertExists(rootBlockId);
    const aiPanel = this.host.view.getWidget(
      AFFINE_AI_PANEL_WIDGET,
      rootBlockId
    );
    if (!(aiPanel instanceof AffineAIPanelWidget)) return nothing;

    return html`<div
      class="menu-item"
      @click=${() =>
        typeof item.handler === 'function' && item.handler(aiPanel)}
      ${hasSubConfig ? ref(this._whenHover.setReference) : ''}
    >
      <span class="item-icon">${item.icon}</span>
      <div class="item-name">${item.name}</div>
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
