import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import {
  type AIItemGroupConfig,
  EdgelessRootService,
} from '@blocksuite/blocks';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { getRootService } from '../../utils/selection-utils.js';

@customElement('ask-ai-panel')
export class AskAIPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
    }

    .ask-ai-panel {
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

    .ask-ai-panel::-webkit-scrollbar {
      width: 5px;
      max-height: 100px;
    }
    .ask-ai-panel::-webkit-scrollbar-thumb {
      border-radius: 20px;
    }
    .ask-ai-panel:hover::-webkit-scrollbar-thumb {
      background-color: var(--affine-black-30);
    }
    .ask-ai-panel::-webkit-scrollbar-corner {
      display: none;
    }
  `;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor actionGroups!: AIItemGroupConfig[];

  get _edgeless() {
    const rootService = getRootService(this.host);
    if (rootService instanceof EdgelessRootService) {
      return rootService;
    }
    return null;
  }

  get _actionGroups() {
    const filteredConfig = this.actionGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.showWhen
            ? item.showWhen(
                this.host.command.chain(),
                this._edgeless ? 'edgeless' : 'page',
                this.host
              )
            : true
        ),
      }))
      .filter(group => group.items.length > 0);
    return filteredConfig;
  }

  override render() {
    return html`<div class="ask-ai-panel">
      <ai-item-list
        .host=${this.host}
        .groups=${this._actionGroups}
      ></ai-item-list>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ask-ai-panel': AskAIPanel;
  }
}
