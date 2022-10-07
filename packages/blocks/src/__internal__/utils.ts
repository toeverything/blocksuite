import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import type { BlockHost } from '@blocksuite/shared';
import type { BaseBlockModel } from '@blocksuite/store';

import type { ListBlockModel } from '../list-block/list-model';
import type { ParagraphBlockModel } from '../paragraph-block/paragraph-model';
import type { GroupBlockModel } from '../group-block/group-model';

// TODO support dynamic block types
function getBlockElement(model: BaseBlockModel, host: BlockHost) {
  switch (model.flavour) {
    case 'paragraph':
      return html`
        <paragraph-block
          .model=${model as ParagraphBlockModel}
          .host=${host}
        ></paragraph-block>
      `;
    case 'list':
      return html`
        <list-block
          .model=${model as ListBlockModel}
          .host=${host}
        ></list-block>
      `;
    case 'group':
      return html`
        <group-block
          .model=${model as GroupBlockModel}
          .host=${host}
        ></group-block>
      `;
  }
  return html`<div>Unknown block type: "${model.flavour}"</div>`;
}

export function getBlockChildrenContainer(
  model: BaseBlockModel,
  host: BlockHost
) {
  return html`
    <style>
      .affine-block-children-container {
        padding-left: 1rem;
      }
    </style>
    <div class="affine-block-children-container">
      ${repeat(
        model.children,
        child => child.id,
        child => getBlockElement(child, host)
      )}
    </div>
  `;
}

// https://stackoverflow.com/a/2345915
export function focusTextEnd(input: HTMLInputElement) {
  const current = input.value;
  input.focus();
  input.value = '';
  input.value = current;
}
