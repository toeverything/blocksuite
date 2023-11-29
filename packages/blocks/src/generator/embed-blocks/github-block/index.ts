import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import { EdgelessSelectableMixin } from '../../../surface-block/elements/selectable.js';
import {
  EmbedBlock,
  EmbedModel,
} from '../embed-block-generator/embed-block.js';
import { embedBlockGenerator } from '../embed-block-generator/index.js';

type GithubBlockProps = {
  owner: string;
  repo: string;
};

@EdgelessSelectableMixin
export class GithubBlockModel extends EmbedModel<GithubBlockProps> {}

export const githubBlockSpec = embedBlockGenerator({
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

@customElement('affine-embed-github-block')
export class GithubBlock extends EmbedBlock<GithubBlockModel> {
  static override styles = css`
    affine-embed-github-block {
      display: block;
      height: 100%;
      width: 100%;
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
    'affine-embed-github-block': GithubBlock;
  }
}
