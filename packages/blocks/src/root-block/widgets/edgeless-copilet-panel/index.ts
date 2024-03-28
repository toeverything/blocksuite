import '../../../_common/components/ai-item/ai-item-list.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { AIItemGroups } from '../../../_common/components/ai-item/config.js';

@customElement('edgeless-copilot-panel')
export class EdgelessCopilotPanel extends WithDisposable(LitElement) {
  static override styles = css`
    .edgeless-copilot-panel {
      display: flex;
      box-sizing: border-box;
      position: absolute;
      padding: 8px;
      min-width: 294px;
      max-height: 374px;
      overflow-y: auto;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      z-index: var(--affine-z-index-popover);
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  override render() {
    return html`
      <div class="edgeless-copilot-panel">
        <ai-item-list .host=${this.host} .groups=${AIItemGroups}></ai-item-list>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-copilot-panel': EdgelessCopilotPanel;
  }
}
