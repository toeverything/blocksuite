import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import {
  EmbedBlock,
  EmbedModel,
} from '../_common/embed-block-generator/embed-block.js';
import { embedBlockGenerator } from '../_common/embed-block-generator/index.js';
import { EdgelessSelectableMixin } from '../surface-block/elements/selectable.js';

type GithubBlockProps = {
  owner: string;
  repo: string;
};

export const embedGithubBlockSpec = embedBlockGenerator({
  schema: {
    name: 'github',
    version: 1,
    toModel: () => new GithubBlockModel(),
    props: () => ({
      owner: '',
      repo: '',
    }),
  },
  view: {
    component: literal`affine-embed-github-block`,
  },
});

@EdgelessSelectableMixin
export class GithubBlockModel extends EmbedModel<GithubBlockProps> {}

@customElement('affine-embed-github-block')
export class EmbedGithubBlock extends EmbedBlock<GithubBlockModel> {
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
