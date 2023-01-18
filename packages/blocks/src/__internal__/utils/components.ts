/* eslint-disable lit/binding-positions, lit/no-invalid-html */
import { html } from 'lit/static-html.js';
import { repeat } from 'lit/directives/repeat.js';
import type { BlockHost } from './types.js';
import type { BaseBlockModel } from '@blocksuite/store';
import type { EmbedBlockModel } from '../../embed-block/index.js';
import { blockService } from '../../models.js';
import '../../components/loader.js';
import { hasService, registerService } from '../service.js';
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../../__internal__/utils/consts.js';

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
        ></${model.tag}>
      `;
    // case 'affine:shape':
    //   // only render shape block in edgeless mode
    //   if (edgeless)
    //     return html`
    //       <${model.tag}
    //         .model=${model}
    //         .host=${host}
    //       ></${model.tag}>
    //     `;
    //   else return null;
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
    const loadOrService =
      blockService[model.flavour as keyof typeof blockService];
    if (loadOrService) {
      const state = registerService(model.flavour, loadOrService);
      if (state instanceof Promise) {
        state.then(() => {
          onLoaded();
        });
        return html` <loader-element .hostModel=${model}> </loader-element> `;
      }
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
  return html`
    <style>
      .affine-block-children-container {
        padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px;
      }
    </style>
    <div class="affine-block-children-container">
      ${repeat(
        model.children,
        child => child.id,
        child => BlockElementWithService(child, host, onLoaded)
      )}
    </div>
  `;
}
