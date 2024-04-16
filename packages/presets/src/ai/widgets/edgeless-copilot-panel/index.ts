import '../ai-item/ai-item-list.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { type EdgelessRootBlockComponent, on } from '@blocksuite/blocks';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { stopPropagation } from '../../utils/selection-utils.js';
import type { AIItemGroupConfig } from '../ai-item/types.js';

@customElement('edgeless-copilot-panel')
export class EdgelessCopilotPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
    }

    .edgeless-copilot-panel {
      box-sizing: border-box;
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

  override connectedCallback(): void {
    super.connectedCallback();
    this._disposables.add(on(this, 'wheel', stopPropagation));
    this._disposables.add(on(this, 'pointerdown', stopPropagation));
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

    if (groups.every(group => group.items.length === 0)) return nothing;

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
