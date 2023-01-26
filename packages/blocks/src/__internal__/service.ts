import type { IService } from './utils/index.js';

const services = new Map<string, IService>();

export function hasService(flavour: string): boolean {
  return services.has(flavour);
}

export function registerService(
  flavour: string,
  Constructor: { new (): IService }
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

export function getService(
  flavour: string,
  strict: false
): IService | undefined;
export function getService(flavour: string, strict?: true): IService;
export function getService(flavour: string, strict = true) {
  const service = services.get(flavour);
  if (strict && !service) {
    throw new Error(`cannot find service '${flavour}'`);
  }
  return service;
}
