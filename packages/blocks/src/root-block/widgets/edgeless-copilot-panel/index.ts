import '../../../_common/components/ai-item/ai-item-list.js';

import type { EditorHost } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type {
  AIItemConfig,
  AIItemGroupConfig,
} from '../../../_common/components/ai-item/types.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { EdgelessModel } from '../../edgeless/type.js';
import { actionWithAI, dragWithAI } from './config.js';

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
  selectedEls!: EdgelessModel[];

  get _groups(): AIItemGroupConfig[] {
    const dragWithAiGroup = {
      ...dragWithAI,
      items: dragWithAI.items.filter(item =>
        item.showWhen(this.selectedEls)
      ) as unknown[] as AIItemConfig[],
    } as AIItemGroupConfig;

    return [actionWithAI as AIItemGroupConfig, dragWithAiGroup];
  }

  override render() {
    const groups = this._groups;

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
