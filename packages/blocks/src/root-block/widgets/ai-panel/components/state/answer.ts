import '../finish-tip.js';

import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { AIPanelAnswerConfig, CopyConfig } from '../../type.js';

@customElement('ai-panel-answer')
export class AIPanelAnswer extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
      display: flex;
      box-sizing: border-box;
      flex-direction: column;
      gap: 8px;
      padding: 0;
    }

    .answer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 4px;
      align-self: stretch;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      padding: 0 12px;
    }

    .answer-head {
      align-self: stretch;

      color: var(--affine-text-secondary-color);

      /* light/xsMedium */
      font-size: var(--affine-font-xs);
      font-style: normal;
      font-weight: 500;
      line-height: 20px; /* 166.667% */
    }

    .answer-body {
      align-self: stretch;

      color: var(--affine-text-primary-color);
      font-feature-settings:
        'clig' off,
        'liga' off;

      /* light/sm */
      font-size: var(--affine-font-xs);
      font-style: normal;
      font-weight: 400;
      line-height: 22px; /* 157.143% */
    }

    .response-list-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .response-list-container,
    .action-list-container {
      padding: 0 8px;
      user-select: none;
    }

    /* set item style outside ai-item */
    .response-list-container ai-item-list,
    .action-list-container ai-item-list {
      --item-padding: 4px;
    }

    .response-list-container ai-item-list {
      --item-icon-color: var(--affine-icon-secondary);
      --item-icon-hover-color: var(--affine-icon-color);
    }
  `;
  @property({ attribute: false })
  config!: AIPanelAnswerConfig;

  @property({ attribute: false })
  finish = true;

  @property({ attribute: false })
  copy?: CopyConfig;

  override render() {
    return html`
      <div class="answer">
        <div class="answer-head">Answer</div>
        <div class="answer-body">
          <slot></slot>
        </div>
      </div>
      ${this.finish
        ? html`
            <ai-finish-tip .copy=${this.copy}></ai-finish-tip>
            ${this.config.responses.length > 0
              ? html`
                  <ai-panel-divider></ai-panel-divider>
                  ${this.config.responses.map(
                    (group, index) => html`
                      ${index !== 0
                        ? html`<ai-panel-divider></ai-panel-divider>`
                        : nothing}
                      <div class="response-list-container">
                        <ai-item-list .groups=${[group]}></ai-item-list>
                      </div>
                    `
                  )}
                `
              : nothing}
            ${this.config.responses.length > 0 && this.config.actions.length > 0
              ? html`<ai-panel-divider></ai-panel-divider>`
              : nothing}
            ${this.config.actions.length > 0
              ? html`
                  <div class="action-list-container">
                    <ai-item-list .groups=${this.config.actions}></ai-item-list>
                  </div>
                `
              : nothing}
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-panel-answer': AIPanelAnswer;
  }
}
