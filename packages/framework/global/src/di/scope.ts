import type { ServiceScope } from './types.js';

import { ROOT_SCOPE } from './consts.js';

export function createScope(
  name: string,
  base: ServiceScope = ROOT_SCOPE
): ServiceScope {
  return [...base, name];
}

export function stringifyScope(scope: ServiceScope): string {
  return scope.join('/');
}
