import { ROOT_SCOPE } from './consts.js';
import type { ServiceScope } from './types.js';

export function createScope(
  name: string,
  base: ServiceScope = ROOT_SCOPE
): ServiceScope {
  return [...base, name];
}

export function stringifyScope(scope: ServiceScope): string {
  return scope.join('/');
}
