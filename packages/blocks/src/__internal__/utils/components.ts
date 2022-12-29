import { html } from 'lit/static-html.js';
import { repeat } from 'lit/directives/repeat.js';
import type { BlockHost } from './types.js';
import type { BaseBlockModel } from '@blocksuite/store';
import type { EmbedBlockModel } from '../../embed-block/index.js';
import { BlockService } from '../../models.js';
import '../../components/loader.js';

// TODO support dynamic block types
export function BlockElement(
  model: BaseBlockModel,
  host: BlockHost,
  edgeless = false
) {
  switch (model.flavour) {
    case 'affine:paragraph':
    case 'affine:list':
    case 'affine:group':
    case 'affine:divider':
    case 'affine:code':
      return html`
        <${model.tag}
          .model=${model}
          .host=${host}
        ></${model.tag}>
      `;
    case 'affine:shape':
      // only render shape block in edgeless mode
      if (edgeless)
        return html`
          <${model.tag}
            .model=${model}
            .host=${host}
          ></${model.tag}>
        `;
      else return null;
    case 'affine:embed':
      return EmbedBlock(model as EmbedBlockModel, host);
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

function BlockElementWithService(
  model: BaseBlockModel,
  host: BlockHost,
  onLoaded: () => void
) {
  const serviceMap = host.serviceMap;
  if (
    serviceMap.has(model.flavour) &&
    serviceMap.get(model.flavour)?.isLoaded === true
  ) {
    return BlockElement(model, host);
  } else {
    const loadOrService =
      BlockService[model.flavour as keyof typeof BlockService];
    if (
      loadOrService !== undefined &&
      loadOrService.constructor.name === 'AsyncFunction'
    ) {
      const load = loadOrService as () => Promise<any>;
      load().then(({ default: Service }) => {
        const service = new Service();
        serviceMap.set(model.flavour, service);
        if ('load' in service) {
          service.load().then(() => {
            service.isLoaded = true;
            onLoaded();
          });
        } else {
          service.isLoaded = true;
          onLoaded();
        }
      });
      return html`<loader-element />`;
    } else if (loadOrService !== undefined) {
      const service = new (loadOrService as any)();
      serviceMap.set(model.flavour, service);
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
        padding-left: 26px;
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
