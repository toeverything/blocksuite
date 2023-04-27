/* eslint-disable lit/binding-positions, lit/no-invalid-html */
import '../../components/loader.js';

import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  BLOCK_ID_ATTR,
} from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';
import { matchFlavours } from '@blocksuite/store';
import { repeat } from 'lit/directives/repeat.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import type { EmbedBlockModel } from '../../embed-block/index.js';
import { blockService } from '../../services.js';
import { hasService, registerService } from '../service.js';
import type { BlockHost } from '../utils/types.js';
import { BaseService } from './index.js';

// TODO support dynamic block types
export function BlockElement(
  model: BaseBlockModel,
  host: BlockHost,
  edgeless = false
) {
  switch (model.flavour) {
    case 'affine:paragraph':
    case 'affine:list':
    case 'affine:frame':
    case 'affine:divider':
    case 'affine:code':
    case 'affine:database':
      return html`
        <${model.tag}
          .model=${model}
          .host=${host}
          class="affine-block-element"
          ${unsafeStatic(BLOCK_ID_ATTR)}=${model.id}
        ></${model.tag}>
      `;

    case 'affine:embed':
      return EmbedBlock(model as EmbedBlockModel, host);
    case 'affine:surface':
      return null;
  }
  return html`<div>Unknown block flavour: "${model.flavour}"</div>`;
}

function EmbedBlock(model: EmbedBlockModel, host: BlockHost) {
  switch (model.type) {
    case 'image':
      return html`
        <affine-image
          .model=${model as EmbedBlockModel}
          .host=${host}
          ${unsafeStatic(BLOCK_ID_ATTR)}=${model.id}
        ></affine-image>
      `;
    default:
      return html`<div>Unknown embed type: "${model.type}"</div>`;
  }
}

export function BlockElementWithService(
  model: BaseBlockModel,
  host: BlockHost,
  onLoaded: () => void
) {
  if (hasService(model.flavour)) {
    return BlockElement(model, host);
  } else {
    const service =
      blockService[model.flavour as keyof typeof blockService] ?? BaseService;

    const state = registerService(model.flavour, service);
    if (state instanceof Promise) {
      state.then(() => {
        onLoaded();
      });
      return html`<loader-element .hostModel=${model}></loader-element>`;
    }

    return BlockElement(model, host);
  }
}

// Naming convention borrowed from
// https://codelabs.developers.google.com/codelabs/lit-2-for-react-devs#4
export function BlockChildrenContainer(
  model: BaseBlockModel,
  host: BlockHost,
  onLoaded: () => void
) {
  if (!model) {
    throw new Error(
      "Failed to render block's children container! model not found"
    );
  }
  const paddingLeft = matchFlavours(model, ['affine:page', 'affine:frame'])
    ? 0
    : BLOCK_CHILDREN_CONTAINER_PADDING_LEFT;

  return html`<div
    class="affine-block-children-container"
    style="padding-left: ${paddingLeft}px;"
  >
    ${repeat(
      model.children,
      child => child.id,
      child => BlockElementWithService(child, host, onLoaded)
    )}
  </div>`;
}
