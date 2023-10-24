import type { Flavour } from '../../models.js';
import type { BlockServiceInstanceByKey } from './legacy-services/index.js';
import type { BaseService } from './service.js';

export const services = new Map<string, BaseService>();

export function registerService(
  flavour: string,
  Constructor: { new (): BaseService }
): Promise<void> | void {
  if (services.has(flavour)) {
    return;
  }
  const service = new Constructor();
  services.set(flavour, service);
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
