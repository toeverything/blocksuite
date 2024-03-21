import { ShadowlessElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('left-side-panel')
export class LeftSidePanel extends ShadowlessElement {
  static override styles = css`
    left-side-panel {
      padding-top: 50px;
      width: 300px;
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      display: none;
    }
  `;
  currentContent: HTMLElement | null = null;

  showContent(ele: HTMLElement) {
    if (this.currentContent) {
      this.currentContent.remove();
    }
    this.style.display = 'block';
    ele.classList.add('blocksuite-overlay');
    this.currentContent = ele;
    this.append(ele);
  }

  hideContent() {
    if (this.currentContent) {
      this.style.display = 'none';
      this.currentContent.remove();
      this.currentContent = null;
    }
  }

  toggle(ele: HTMLElement) {
    if (this.currentContent !== ele) {
      this.showContent(ele);
    } else {
      this.hideContent();
    }
  }

  protected override render(): unknown {
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'left-side-panel': LeftSidePanel;
  }
}
