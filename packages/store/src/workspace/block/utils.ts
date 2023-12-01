import type { ProxyOptions } from '../../reactive/index.js';
import { createYProxy, native2Y } from '../../reactive/index.js';

export function valueToProps(
  value: unknown,
  options: ProxyOptions<never>
): unknown {
  return createYProxy(value, options);
}

export function propsToValue(value: unknown): unknown {
  return native2Y(value, true);
}
