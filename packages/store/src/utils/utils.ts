import { fromBase64, toBase64 } from 'lib0/buffer.js';
import * as Y from 'yjs';
import type { z } from 'zod';

import { SYS_KEYS } from '../consts.js';
import type { BlockSchema, BlockSchemaType } from '../schema/base.js';
import { BaseBlockModel, internalPrimitives } from '../schema/base.js';
import type { Workspace } from '../workspace/index.js';
import type { Page } from '../workspace/index.js';
import type {
  BlockProps,
  BlockSysProps,
  YBlock,
  YBlocks,
} from '../workspace/page.js';
import type { ProxyManager } from '../yjs/index.js';
import { canToProxy, canToY } from '../yjs/index.js';
import { native2Y, NativeWrapper, Text } from '../yjs/index.js';

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

export function valueToProps(value: unknown, proxy: ProxyManager): unknown {
  if (NativeWrapper.is(value)) {
    return new NativeWrapper(value);
  }

  if (value instanceof Y.Text) {
    return new Text(value);
  }

  if (canToProxy(value)) {
    return proxy.createYProxy(value);
  }

  return value;
}

export function propsToValue(value: unknown): unknown {
  if (value instanceof NativeWrapper) {
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
  proxy: ProxyManager
): Partial<BlockProps> {
  const prefixedProps = yBlock.toJSON();
  const props: Partial<BlockProps> = {};

  Object.keys(prefixedProps).forEach(prefixedKey => {
    if (prefixedKey.startsWith('prop:')) {
      const key = prefixedKey.replace('prop:', '');
      const realValue = yBlock.get(prefixedKey);
      props[key] = valueToProps(realValue, proxy);
    }
  });

  return props;
}

export function schemaToModel(
  id: string,
  schema: BlockSchemaType,
  block: YBlock,
  page: Page
) {
  const props = toBlockProps(block, page.doc.proxy);
  const blockModel = schema.model.toModel
    ? schema.model.toModel()
    : new BaseBlockModel();

  // Bind props to model
  Object.assign(blockModel, props);

  blockModel.id = id;
  blockModel.flavour = schema.model.flavour;
  blockModel.role = schema.model.role;
  blockModel.page = page;
  blockModel.yBlock = block;

  return blockModel;
}

export function encodeWorkspaceAsYjsUpdateV2(workspace: Workspace): string {
  return toBase64(Y.encodeStateAsUpdateV2(workspace.doc));
}

export function applyYjsUpdateV2(workspace: Workspace, update: string): void {
  Y.applyUpdateV2(workspace.doc, fromBase64(update));
}
