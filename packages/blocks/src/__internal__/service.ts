import type { Service, SyncServiceProtocol } from './utils/index.js';
import type { BaseBlockModel } from '@blocksuite/store';

export class BaseService {
  public block2html(
    model: BaseBlockModel,
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    const delta = model.text?.sliceToDelta(begin || 0, end);
    const text = delta.reduce((html: string, item: Record<string, unknown>) => {
      return html + this._deltaLeaf2Html(item);
    }, '');
    return `${text}${childText}`;
  }

  public block2Text(
    model: BaseBlockModel,
    childText: string,
    begin?: number,
    end?: number
  ) {
    const text = (model.text?.toString() || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }

  private _deltaLeaf2Html(deltaLeaf: Record<string, unknown>) {
    let text = deltaLeaf.insert;
    const attributes: Record<string, boolean> = deltaLeaf.attributes as Record<
      string,
      boolean
    >;
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

export class SyncBaseService
  extends BaseService
  implements SyncServiceProtocol
{
  isLoaded = true as const;
}

const services = new Map<string, Service>();

export function hasService(flavour: string): boolean {
  return services.has(flavour);
}

export function registerService(
  flavour: string,
  loadOrConstructor:
    | (() => Promise<{ default: { new (): Service } }>)
    | { new (): Service }
): Promise<void> | void {
  if (services.has(flavour)) {
    console.error(`'${flavour}' already be registered!`);
    return;
  }
  if (loadOrConstructor.constructor.name === 'AsyncFunction') {
    const load = loadOrConstructor as () => Promise<{
      default: { new (): Service };
    }>;
    return new Promise(resolve => {
      load().then(async m => {
        const service = new m.default();
        if ('load' in service && typeof service.load === 'function') {
          service.load().then(() => {
            service.isLoaded = true;
            services.set(flavour, service);
            resolve();
          });
        } else {
          service.isLoaded = true;
          services.set(flavour, service);
          resolve();
        }
      });
    });
  } else {
    const Constructor = loadOrConstructor as {
      new (): Service;
    };
    const service = new Constructor();
    if ('load' in service && typeof service.load === 'function') {
      return new Promise(resolve => {
        service.load().then(() => {
          service.isLoaded = true;
          services.set(flavour, service);
          resolve();
        });
      });
    } else {
      service.isLoaded = true;
      services.set(flavour, service);
    }
    return;
  }
}

export function getService(flavour: string, strict: false): Service | undefined;
export function getService(flavour: string, strict?: true): Service;
export function getService(flavour: string, strict = true) {
  const service = services.get(flavour);
  if (strict && !service) {
    throw new Error(`cannot find service '${flavour}'`);
  }
  return service;
}
