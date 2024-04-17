import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import { AIStarIcon } from '../../../_common/icons/ai.js';
import { requestConnectedFrame } from '../../../_common/utils/event.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

@customElement('edgeless-copilot-toolbar-entry')
export class EdgelessCopilotToolbarEntry extends WithDisposable(LitElement) {
  static override styles = css`
    .copilot-icon-button {
      color: var(--affine-brand-color);
      font-weight: 500;
      font-size: var(--affine-font-sm);
      position: relative;
    }

    .copilot-icon-button span {
      line-height: 22px;
      padding-left: 4px;
    }

    edgeless-copilot-panel {
      top: 44px;
      left: 0px;
      position: absolute;
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  groups!: AIItemGroupConfig[];

  @state()
  private _showPanel = false;

  override render() {
    return html`
      <div class="copilot-button">
        <icon-button
          class="copilot-icon-button"
          width="75px"
          height="32px"
          @click=${() => (this._showPanel = !this._showPanel)}
        >
          ${AIStarIcon} <span>Ask AI</span>
        </icon-button>
        <div class="copilot-panel">
          ${this._showPanel
            ? html`<edgeless-copilot-panel
            .edgeless=${this.edgeless}
            .host=${this.host}
            .groups=${this.groups}
            .entry=${'toolbar'}
            .onClick=${() => {
              requestConnectedFrame(() => (this._showPanel = false), this);
            }}
          ></edgeless-copilot-panel>
        </div>`
            : nothing}
        </div>
      </div>
    `;
  }
}
