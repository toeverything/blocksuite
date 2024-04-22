import './_common/generating-placeholder.js';

import { type AffineAIPanelWidgetConfig } from '@blocksuite/blocks';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { preprocessHtml } from '../utils/html.js';

@customElement('ai-answer-wrapper')
export class AIAnswerWrapper extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      padding: 8px 12px;
      box-sizing: border-box;
      border-radius: 4px;
      border: 1px solid var(--affine-border-color);
      box-shadow: var(--affine-shadow-1);
      background: var(--affine-background-secondary-color);
      overflow: hidden;
    }

    ::slotted(.ai-answer-iframe) {
      width: 100%;
      height: 100%;
      border: none;
    }

    ::slotted(.ai-answer-image) {
      width: 100%;
      height: auto;
    }
  `;

  protected override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-answer-wrapper': AIAnswerWrapper;
  }
}

export const createIframeRenderer: AffineAIPanelWidgetConfig['answerRenderer'] =
  (answer, state) => {
    if (state !== 'finished') {
      return html`<ai-generating-placeholder></ai-generating-placeholder>`;
    }

    const template = html`<iframe
      class="ai-answer-iframe"
      sandbox="allow-scripts"
      scrolling="no"
      allowfullscreen
      .srcdoc=${preprocessHtml(answer)}
    >
    </iframe>`;
    return html`<ai-answer-wrapper>${template}</ai-answer-wrapper>`;
  };

export const createImageRenderer: AffineAIPanelWidgetConfig['answerRenderer'] =
  (answer, state) => {
    if (state !== 'finished') {
      return html`<ai-generating-placeholder></ai-generating-placeholder>`;
    }

    const template = html`<img class="ai-answer-image" src=${answer}></img>`;
    return html`<ai-answer-wrapper>${template}</ai-answer-wrapper>`;
  };
