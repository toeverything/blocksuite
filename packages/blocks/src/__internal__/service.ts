import type { Service } from './utils/index.js';

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
