import type { BlockServiceInstanceByKey } from '../models.js';
import { type BlockService, blockService, type Flavour } from '../models.js';
import { BaseService } from './service/index.js';

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
): BlockServiceInstanceByKey<Key>;
export function getService(flavour: string): BaseService;
export function getService(flavour: string): BaseService {
  const service = services.get(flavour);
  if (!service) {
    throw new Error(`cannot find service by flavour ${flavour}`);
  }
  return service as BaseService;
}

export function getServiceOrRegister<Key extends Flavour>(
  flavour: Key
): BlockServiceInstanceByKey<Key> | Promise<BlockServiceInstanceByKey<Key>>;
export function getServiceOrRegister(
  flavour: string
): BaseService | Promise<BaseService>;
export function getServiceOrRegister(
  flavour: string
): BaseService | Promise<BaseService> {
  const service = services.get(flavour);
  if (!service) {
    const Constructor =
      blockService[flavour as keyof BlockService] ?? BaseService;
    const result = registerService(flavour, Constructor);
    if (result instanceof Promise) {
      return result.then(() => services.get(flavour) as BaseService);
    } else {
      return services.get(flavour) as BaseService;
    }
  }
  return service as BaseService;
}
