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
