import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { EmbedBlockElement } from '../_common/embed-block-helper/index.js';
import type { EmbedGithubBlockModel } from './embed-github-model.js';

@customElement('affine-embed-github-block')
export class EmbedGithubBlock extends EmbedBlockElement<EmbedGithubBlockModel> {
  static override styles = css`
    affine-embed-github-block {
      display: block;
      height: 100%;
      width: 100%;
      background: var(--affine-background-primary-color);
      border: 1px solid var(--affine-border-color);
      padding: 12px;
      margin: 0;
    }
  `;
  override render(): unknown {
    return this.renderEmbed(() => {
      return html`
        <h3>GitHub Card</h3>
        <div>${this.model.owner}/${this.model.repo}</div>
      `;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-github-block': EmbedGithubBlock;
  }
}
