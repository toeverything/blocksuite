import { toBase64 } from 'lib0/buffer.js';
import * as Y from 'yjs';
import type { z } from 'zod';

import { SYS_KEYS } from '../consts.js';
import type { BlockSchema } from '../schema/base.js';
import { internalPrimitives } from '../schema/base.js';
import type { YBlock } from '../workspace/block.js';
import type { Workspace } from '../workspace/index.js';
import type { BlockProps, YBlocks } from '../workspace/page.js';
import type { ProxyOptions } from '../yjs/index.js';
import { canToProxy, canToY, createYProxy } from '../yjs/index.js';
import { Boxed, native2Y, Text } from '../yjs/index.js';

export function assertValidChildren(
  yBlocks: YBlocks,
  props: Partial<BlockProps>
) {
  if (!Array.isArray(props.children)) return;

  props.children.forEach(child => {
    if (!yBlocks.has(child.id)) {
      throw new Error('Invalid child id: ' + child.id);
    }
  });
}

export function syncBlockProps(
  schema: z.infer<typeof BlockSchema>,
  yBlock: YBlock,
  props: Partial<BlockProps>
) {
  const defaultProps = schema.model.props?.(internalPrimitives) ?? {};

  Object.entries(props).forEach(([key, value]) => {
    if (SYS_KEYS.has(key)) return;
    if (value === undefined) return;

    yBlock.set(`prop:${key}`, propsToValue(value));
  });

  // set default value
  Object.entries(defaultProps).forEach(([key, value]) => {
    const notExists =
      !yBlock.has(`prop:${key}`) || yBlock.get(`prop:${key}`) === undefined;
    if (!notExists) {
      return;
    }

    yBlock.set(`prop:${key}`, propsToValue(value));
  });
}

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

export function encodeWorkspaceAsYjsUpdateV2(workspace: Workspace): string {
  return toBase64(Y.encodeStateAsUpdateV2(workspace.doc));
}
