import './ai-action-list.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { createButtonPopper } from '../../../root-block/edgeless/components/utils.js';
import type { AffineFormatBarWidget } from '../../../root-block/widgets/format-bar/format-bar.js';
import { AIStarIcon } from '../../icons/ai.js';
import { AIActionConfig } from './config.js';
@customElement('ask-ai-button')
export class AskAIButton extends WithDisposable(LitElement) {
  static override styles = css`
    .ask-ai-icon-button {
      color: var(--affine-brand-color);
      font-weight: 500;
      font-size: var(--affine-font-sm);
    }

    .ask-ai-icon-button span {
      line-height: 22px;
      padding-left: 4px;
    }

    .ask-ai-panel {
      display: none;
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

    .ask-ai-panel[data-show] {
      display: flex;
    }

    .ask-ai-icon-button svg {
      color: var(--affine-brand-color);
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
  formatBar!: AffineFormatBarWidget;

  @query('.ask-ai-button')
  private _askAIButton!: HTMLDivElement;
  @query('.ask-ai-panel')
  private _askAIPanel!: HTMLDivElement;
  private _askAIPopper: ReturnType<typeof createButtonPopper> | null = null;

  override firstUpdated() {
    this._askAIPopper = createButtonPopper(
      this._askAIButton,
      this._askAIPanel,
      () => {},
      10,
      102
    );
    this.disposables.add(this._askAIPopper);
  }

  get _actionGroups() {
    const filteredConfig = AIActionConfig.map(group => ({
      ...group,
      items: group.items.filter(item => item.showWhen()),
    })).filter(group => group.items.length > 0);
    return filteredConfig;
  }

  override render() {
    return html`<div class="ask-ai-button">
      <icon-button
        class="ask-ai-icon-button"
        width="75px"
        height="32px"
        @click=${() => this._askAIPopper?.toggle()}
      >
        ${AIStarIcon} <span>Ask AI</span></icon-button
      >
      <div class="ask-ai-panel">
        <ai-action-list
          .host=${this.formatBar.host}
          .groups=${this._actionGroups}
        ></ai-action-list>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ask-ai-button': AskAIButton;
  }
}

export const affineFormatBarAskAIButton = {
  type: 'custom' as const,
  render(formatBar: AffineFormatBarWidget): TemplateResult | null {
    return html`<ask-ai-button .formatBar=${formatBar}></ask-ai-button>`;
  },
};
