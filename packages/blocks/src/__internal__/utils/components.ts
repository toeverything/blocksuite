import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import type { BlockHost } from '../utils';
import type { BaseBlockModel } from '@blocksuite/store';

import type { ListBlockModel } from '../../list-block';
import type { ParagraphBlockModel } from '../../paragraph-block';
import type { GroupBlockModel } from '../../group-block';
import type { CodeBlockModel } from '../../code-block';
import type { DividerBlockModel } from '../../divider-block/divider-model';
import type { EmbedBlockModel } from '../../embed-block';

// TODO support dynamic block types
export function BlockElement(model: BaseBlockModel, host: BlockHost) {
  switch (model.flavour) {
    case 'affine:paragraph':
      return html`
        <paragraph-block
          .model=${model as ParagraphBlockModel}
          .host=${host}
        ></paragraph-block>
      `;
    case 'affine:list':
      return html`
        <list-block
          .model=${model as ListBlockModel}
          .host=${host}
        ></list-block>
      `;
    case 'affine:group':
      return html`
        <group-block
          .model=${model as GroupBlockModel}
          .host=${host}
        ></group-block>
      `;
    case 'affine:divider':
      return html`
        <divider-block
          .model=${model as DividerBlockModel}
          .host=${host}
        ></divider-block>
      `;
    case 'affine:embed':
      return EmbedBlock(model as EmbedBlockModel, host);
    case 'affine:code':
      return html` <code-block
          .model=${model as CodeBlockModel}
          .host=${host}
      ></code-block>`;
  }
  return html`<div>Unknown block type: "${model.flavour}"</div>`;
}

function EmbedBlock(model: EmbedBlockModel, host: BlockHost) {
  switch (model.type) {
    case 'image':
      return html`
        <img-block .model=${model as EmbedBlockModel} .host=${host}></img-block>
      `;
    default:
      return html`<div>Unknown embed type: "${model.type}"</div>`;
  }
}

// Naming convention borrowed from
// https://codelabs.developers.google.com/codelabs/lit-2-for-react-devs#4
export function BlockChildrenContainer(model: BaseBlockModel, host: BlockHost) {
  return html`
    <style>
      .affine-block-children-container {
        padding-left: 26px;
      }
    </style>
    <div class="affine-block-children-container">
      ${repeat(
        model.children,
        child => child.id,
        child => BlockElement(child, host)
      )}
    </div>
  `;
}
