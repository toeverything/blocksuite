import './ai-action-item.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
// import { flip, offset } from '@floating-ui/dom';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
// import { ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';

// import { HoverController } from '../../../../../_common/components/hover/controller.js';
import {
  AIActionConfig,
  type AIActionConfigGroup,
  // type AIActionSubConfigItem,
} from './config.js';

@customElement('ai-action-list')
export class AIActionList extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }
    .group-name {
      display: flex;
      padding: 8px 12px;
      align-items: center;
      color: var(--affine-text-secondary-color);
      text-align: justify;
      font-size: var(--affine-font-xs);
      font-style: normal;
      font-weight: 500;
      line-height: 20px;
      width: 100%;
      box-sizing: border-box;
    }
  `;

  @property({ attribute: false })
  groups: AIActionConfigGroup[] = AIActionConfig;

  @property({ attribute: false })
  host!: EditorHost;

  private _getGroupName(name: string) {
    const groupName = name === 'others' ? name : name + ' with ai';
    return groupName.toLocaleUpperCase();
  }

  override render() {
    return html`${repeat(this.groups, group => {
      return html`
        ${group.name
          ? html`<div class="group-name">
              ${this._getGroupName(group.name)}
            </div>`
          : nothing}
        ${repeat(
          group.items,
          item =>
            html`<ai-action-item
              .item=${item}
              .host=${this.host}
            ></ai-action-item>`
        )}
      `;
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-action-list': AIActionList;
  }
}
