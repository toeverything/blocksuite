import { fromBase64, toBase64 } from 'lib0/buffer.js';
import * as Y from 'yjs';
import type { z } from 'zod';

import { SYS_KEYS } from '../consts.js';
import type { BlockSchema } from '../schema/base.js';
import { internalPrimitives } from '../schema/base.js';
import type { Workspace } from '../workspace/index.js';
import type {
  BlockProps,
  BlockSysProps,
  YBlock,
  YBlocks,
} from '../workspace/page.js';
import type { ProxyManager, ProxyOptions } from '../yjs/index.js';
import { canToProxy, canToY } from '../yjs/index.js';
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

export function initSysProps(yBlock: YBlock, props: BlockSysProps) {
  yBlock.set('sys:id', props.id);
  yBlock.set('sys:flavour', props.flavour);

  const yChildren = new Y.Array();
  yBlock.set('sys:children', yChildren);
  if (Array.isArray(props.children)) {
    props.children.forEach(child => yChildren.push([child.id]));
  }
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
  proxy: ProxyManager,
  options: ProxyOptions<never>
): unknown {
  if (Boxed.is(value)) {
    return new Boxed(value);
  }

  if (value instanceof Y.Text) {
    return new Text(value);
  }

  if (canToProxy(value)) {
    return proxy.createYProxy(value, options);
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

export function toBlockProps(
  yBlock: YBlock,
  proxy: ProxyManager,
  options: ProxyOptions<Record<string, unknown>> = {}
): Partial<BlockProps> {
  const prefixedProps = yBlock.toJSON();
  const props: Partial<BlockProps> = {};

  Object.keys(prefixedProps).forEach(prefixedKey => {
    if (prefixedKey.startsWith('prop:')) {
      const key = prefixedKey.replace('prop:', '');
      const realValue = yBlock.get(prefixedKey);
      props[key] = valueToProps(realValue, proxy, options);
    }
  });

  return props;
}

export function encodeWorkspaceAsYjsUpdateV2(workspace: Workspace): string {
  return toBase64(Y.encodeStateAsUpdateV2(workspace.doc));
}

export function applyYjsUpdateV2(workspace: Workspace, update: string): void {
  Y.applyUpdateV2(workspace.doc, fromBase64(update));
}
