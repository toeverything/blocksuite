import '../../../_common/components/ai-item/ai-item-list.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import { on, stopPropagation } from '../../../_common/utils/event.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

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
      min-width: 330px;
      max-height: 374px;
      overflow-y: auto;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      z-index: var(--affine-z-index-popover);
    }

    .edgeless-copilot-panel::-webkit-scrollbar {
      width: 5px;
      max-height: 40px;
    }
    .edgeless-copilot-panel::-webkit-scrollbar-thumb {
      border-radius: 20px;
    }
    .edgeless-copilot-panel:hover::-webkit-scrollbar-thumb {
      background-color: var(--affine-black-30);
    }
    .edgeless-copilot-panel::-webkit-scrollbar-corner {
      display: none;
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  groups!: AIItemGroupConfig[];

  @property({ attribute: false })
  entry?: 'toolbar' | 'selection';

  @property({ attribute: false })
  onClick?: () => void;

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
        <ai-item-list
          .onClick=${() => {
            this.onClick?.();
          }}
          .host=${this.host}
          .groups=${groups}
        ></ai-item-list>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-copilot-panel': EdgelessCopilotPanel;
  }
}
