import type { IService } from './utils/index.js';
import type { DeltaOperation } from 'quill';
import type { BaseBlockModel } from '@blocksuite/store';
import {
  BlockService,
  blockService,
  BlockServiceInstance,
  Flavour,
} from '../models.js';

export class BaseService implements IService {
  onLoad?: () => Promise<void>;
  block2html(
    block: BaseBlockModel,
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    const delta = block.text?.sliceToDelta(begin || 0, end) || [];
    const text = delta.reduce((html: string, item: DeltaOperation) => {
      return html + BaseService.deltaLeaf2Html(item);
    }, '');
    return `${text}${childText}`;
  }

  block2Text(
    block: BaseBlockModel,
    childText: string,
    begin?: number,
    end?: number
  ) {
    const text = (block.text?.toString() || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }

  private static deltaLeaf2Html(deltaLeaf: DeltaOperation) {
    let text: string = deltaLeaf.insert;
    const attributes = deltaLeaf.attributes;
    if (!attributes) {
      return text;
    }
    if (attributes.code) {
      text = `<code>${text}</code>`;
    }
    if (attributes.bold) {
      text = `<strong>${text}</strong>`;
    }
    if (attributes.italic) {
      text = `<em>${text}</em>`;
    }
    if (attributes.underline) {
      text = `<u>${text}</u>`;
    }
    if (attributes.strikethrough) {
      text = `<s>${text}</s>`;
    }
    if (attributes.link) {
      text = `<a href='${attributes.link}'>${text}</a>`;
    }
    return text;
  }
}

const services = new Map<string, BaseService>();

export function hasService(flavour: string): boolean {
  return services.has(flavour);
}

export function registerService(
  flavour: string,
  Constructor: { new (): BaseService }
): Promise<void> | void {
  if (services.has(flavour)) {
    console.error(`'${flavour}' already be registered!`);
    return;
  }
  const service = new Constructor();
  if ('onLoad' in service && typeof service.onLoad === 'function') {
    const onLoad = service.onLoad.bind(service);
    return new Promise(resolve => {
      onLoad().then(() => {
        services.set(flavour, service);
        resolve();
      });
    });
  } else {
    services.set(flavour, service);
  }
  return;
}

/**
 * @internal
 */
export function getService<Key extends Flavour>(
  flavour: Key
): BlockServiceInstance[Key] {
  const service = services.get(flavour);
  if (!service) {
    throw new Error(`cannot find service by flavour ${flavour}`);
  }
  return service as BlockServiceInstance[Key];
}

export function getServiceOrRegister<Key extends Flavour>(
  flavour: Key
): BlockServiceInstance[Key] | Promise<BlockServiceInstance[Key]> {
  const service = services.get(flavour);
  if (!service) {
    const Constructor =
      blockService[flavour as keyof BlockService] ?? BaseService;
    const result = registerService(flavour, Constructor);
    if (result instanceof Promise) {
      return result.then(
        () => services.get(flavour) as BlockServiceInstance[Key]
      );
    } else {
      return services.get(flavour) as BlockServiceInstance[Key];
    }
  }
  return service as BlockServiceInstance[Key];
}
