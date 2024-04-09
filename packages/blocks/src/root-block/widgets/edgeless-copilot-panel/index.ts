import '../../../_common/components/ai-item/ai-item-list.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

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

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  groups!: AIItemGroupConfig[];

  private _getChain() {
    return this.edgeless.service.std.command.chain();
  }

  hide() {
    this.remove();
  }

  override render() {
    const chain = this._getChain();
    const groups = this.groups.reduce((pre, group) => {
      const filtered = group.items.filter(item =>
        item.showWhen?.(chain, 'edgeless', this.host)
      );

      if (filtered.length > 0) pre.push({ ...group, items: filtered });

      return pre;
    }, [] as AIItemGroupConfig[]);

    return html`
      <div class="edgeless-copilot-panel">
        <ai-item-list .host=${this.host} .groups=${groups}></ai-item-list>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-copilot-panel': EdgelessCopilotPanel;
  }
}
