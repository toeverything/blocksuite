import { LightLoadingIcon } from '@blocksuite/affine-components/icons';
import { ShadowlessElement } from '@blocksuite/block-std';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, html, unsafeCSS } from 'lit';

import { importMindMapIcon } from './icons.js';

export class MindMapPlaceholder extends ShadowlessElement {
  static override styles = css`
    mindmap-import-placeholder {
      display: flex;
      flex-direction: column;

      padding: 28px 12px 12px;
      box-sizing: border-box;
      width: 200px;
      height: 122px;

      border-radius: 12px;
      gap: 12px;

      background-color: ${unsafeCSS(cssVarV2('layer/background/secondary'))};
      border: 1px solid ${unsafeCSS(cssVarV2('layer/insideBorder/border'))};
      color: ${unsafeCSS(cssVarV2('text/placeholder'))};

      box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
    }

    mindmap-import-placeholder .preview-icon {
      text-align: center;
    }

    mindmap-import-placeholder .description {
      display: flex;
      gap: 8px;

      color: ${unsafeCSS(cssVarV2('text/placeholder'))};
      font-size: 14px;
      line-height: 22px;

      align-items: center;
    }
  `;

  override render() {
    return html`<div class="placeholder-container">
      <div class="preview-icon">${importMindMapIcon}</div>
      <div class="description">
        ${LightLoadingIcon}
        <span>Importing mind map...</span>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mindmap-import-placeholder': MindMapPlaceholder;
  }
}
