import * as Y from 'yjs';

import type { ProxyOptions } from '../../reactive/index.js';
import {
  Boxed,
  canToProxy,
  canToY,
  createYProxy,
  native2Y,
  Text,
} from '../../reactive/index.js';

export function valueToProps(
  value: unknown,
  options: ProxyOptions<never>
): unknown {
  if (Boxed.is(value)) {
    return new Boxed(value);
  }

  if (value instanceof Y.Text) {
    return new Text(value);
  }

  if (canToProxy(value)) {
    return createYProxy(value, options);
  }

  return value;
}

export function propsToValue(value: unknown): unknown {
  if (value instanceof Boxed) {
    return value.yMap;
  }

  if (value instanceof Text) {
    return value.yText;
  }

  if (canToY(value)) {
    return native2Y(value, true);
  }

  return value;
}
