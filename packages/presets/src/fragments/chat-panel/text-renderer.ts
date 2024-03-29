import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('ai-text-renderer')
export class AITextRenderer extends WithDisposable(LitElement) {
  @property({ attribute: false })
  text!: string;

  protected override render() {
    return html` <div style="white-space: pre-wrap">${this.text}</div>`;
  }
}

@customElement('ai-loading')
export class AIloading extends WithDisposable(LitElement) {
  protected override render() {
    return html`loading...`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-text-renderer': AITextRenderer;
    'ai-loading': AIloading;
  }
}
