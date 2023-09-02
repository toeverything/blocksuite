import { isPrimitive } from '@blocksuite/global/utils';
import { fromBase64, toBase64 } from 'lib0/buffer.js';
import * as Y from 'yjs';
import type { z } from 'zod';

import type { BlockSchema } from '../schema/base.js';
import { internalPrimitives } from '../schema/base.js';
import type { Workspace } from '../workspace/index.js';
import type { BlockProps, YBlock, YBlocks } from '../workspace/page.js';
import type { ProxyManager } from '../yjs/index.js';
import { canToProxy, canToY } from '../yjs/index.js';
import { native2Y, NativeWrapper, Text } from '../yjs/index.js';

const SYS_KEYS = new Set(['id', 'flavour', 'children']);

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

export function initInternalProps(yBlock: YBlock, props: Partial<BlockProps>) {
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
  props: Partial<BlockProps>,
  ignoredKeys: Set<string>
) {
  const propSchema = schema.model.props?.(internalPrimitives) ?? {};

  Object.entries(props).forEach(([key, value]) => {
    if (SYS_KEYS.has(key) || ignoredKeys.has(key)) return;

    const isText = propSchema[key] instanceof Text;
    if (isText) {
      const text =
        value instanceof Text ? value.yText : new Y.Text(value as string);
      yBlock.set(`prop:${key}`, text);
      return;
    }

    if (propSchema[key] instanceof NativeWrapper) {
      if (!(value instanceof NativeWrapper)) {
        throw new Error('Invalid NativeWrapper value');
      }
      yBlock.set(`prop:${key}`, value.yMap);
      return;
    }

    if (
      !isPrimitive(value) &&
      !Array.isArray(value) &&
      typeof value !== 'object'
    ) {
      throw new Error('Only top level primitives are supported for now');
    }

    if (value === undefined) {
      return;
    }

    if (canToY(value)) {
      yBlock.set(`prop:${key}`, native2Y(value, true));
      return;
    }

    yBlock.set(`prop:${key}`, value);
  });

  // set default value
  Object.entries(propSchema).forEach(([key, value]) => {
    if (!yBlock.has(`prop:${key}`) || yBlock.get(`prop:${key}`) === undefined) {
      if (value instanceof NativeWrapper) {
        yBlock.set(`prop:${key}`, value.yMap);
        return;
      }

      if (value instanceof Text) {
        yBlock.set(`prop:${key}`, value.yText);
        return;
      }

      if (canToY(value)) {
        yBlock.set(`prop:${key}`, native2Y(value, true));
        return;
      }

      yBlock.set(`prop:${key}`, value);
    }
  });
}

export function toBlockProps(
  yBlock: YBlock,
  proxy: ProxyManager
): Partial<BlockProps> {
  const prefixedProps = yBlock.toJSON();
  const props: Partial<BlockProps> = {};

  Object.keys(prefixedProps).forEach(prefixedKey => {
    if (prefixedProps[prefixedKey] && prefixedKey.startsWith('prop:')) {
      const key = prefixedKey.replace('prop:', '');
      const realValue = yBlock.get(prefixedKey);

      if (NativeWrapper.is(realValue)) {
        props[key] = new NativeWrapper(realValue);
        return;
      }

      if (canToProxy(realValue)) {
        props[key] = proxy.createYProxy(realValue);
        return;
      }

      props[key] = prefixedProps[prefixedKey];
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
