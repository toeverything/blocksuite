import { ShadowlessElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('side-panel')
export class SidePanel extends ShadowlessElement {
  static override styles = css`
    side-panel {
      width: 395px;
      background-color: var(--affine-background-secondary-color);
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      display: none;
    }
  `;

  currentContent: HTMLElement | null = null;

  hideContent() {
    if (this.currentContent) {
      this.style.display = 'none';
      this.currentContent.remove();
      this.currentContent = null;
    }
  }

  protected override render(): unknown {
    return html``;
  }

  showContent(ele: HTMLElement) {
    if (this.currentContent) {
      this.currentContent.remove();
    }
    this.style.display = 'block';
    this.currentContent = ele;
    this.append(ele);
  }

  toggle(ele: HTMLElement) {
    if (this.currentContent !== ele) {
      this.showContent(ele);
    } else {
      this.hideContent();
    }
  }
}
