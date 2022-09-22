import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import type { BaseBlockModel } from '@building-blocks/store';
import type { ListBlockModel } from '../list-block/list-model';
import type { TextBlockModel } from '../text-block/text-model';
import type { PageContainer } from '../types';

// TODO support dynamic block types
function getBlockElement(model: BaseBlockModel, page: PageContainer) {
  const { store } = page;
  switch (model.flavour) {
    case 'text':
      return html`
        <text-block-element
          .model=${model as TextBlockModel}
          .store=${store}
          .page=${page}
        ></text-block-element>
      `;
    case 'list':
      return html`
        <list-block-element
          .model=${model as ListBlockModel}
          .store=${store}
          .page=${page}
        ></list-block-element>
      `;
  }
  return html`<div>Unknown block type: "${model.flavour}"</div>`;
}

export function getChildBlocks(model: BaseBlockModel, page: PageContainer) {
  return html`
    ${repeat(
      model.children,
      child => child.id,
      child => getBlockElement(child, page)
    )}
  `;
}
