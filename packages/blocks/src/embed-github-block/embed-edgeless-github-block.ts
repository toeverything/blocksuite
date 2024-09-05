import { customElement } from 'lit/decorators.js';

import { toEdgelessEmbedBlock } from '../_common/embed-block-helper/embed-block-element.js';
import { EmbedGithubBlockComponent } from './embed-github-block.js';

@customElement('affine-embed-edgeless-github-block')
export class EmbedEdgelessGithubBlockComponent extends toEdgelessEmbedBlock(
  EmbedGithubBlockComponent
) {}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-edgeless-github-block': EmbedEdgelessGithubBlockComponent;
  }
}
