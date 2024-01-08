import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { EmbedBlockElement } from '../_common/embed-block-helper/embed-block-element.js';
import type { EmbedGithubModel } from './embed-github-model.js';

@customElement('affine-embed-github-block')
export class EmbedGithubBlock extends EmbedBlockElement<EmbedGithubModel> {
  static override styles = css`
    .affine-embed-github-block {
      display: block;
      height: 100%;
      width: 100%;
      background: var(--affine-background-primary-color);
      border: 1px solid var(--affine-border-color);
      padding: 12px;
    }
    affine-embed-github-block {
      display: block;
      width: 100%;
      height: 100%;
    }
    * + affine-embed-github-block {
      margin-top: 12px;
    }
  `;

  override render() {
    return this.renderEmbed(() => {
      return html`
        <div class="affine-embed-github-block">
          <h3>GitHub Card</h3>
          <div>${this.model.owner}/${this.model.repo}</div>
        </div>
      `;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-github-block': EmbedGithubBlock;
  }
}
