import type { BlockModels } from '@blocksuite/global/types';
import { isPrimitive, matchFlavours, SYS_KEYS } from '@blocksuite/global/utils';
import { fromBase64, toBase64 } from 'lib0/buffer.js';
import * as Y from 'yjs';
import type { z } from 'zod';

import type { BaseBlockModel, BlockSchema } from '../base.js';
import { internalPrimitives } from '../base.js';
import { Text } from '../text-adapter.js';
import type { Workspace } from '../workspace/index.js';
import type {
  BlockProps,
  PrefixedBlockProps,
  YBlock,
  YBlocks,
} from '../workspace/page.js';
import type { Page } from '../workspace/page.js';

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
  if (props.flavour === 'affine:page') {
    yBlock.set('ext:cells', new Y.Map());
    yBlock.set('ext:columns', new Y.Map());
  }

  const yChildren = new Y.Array();
  yBlock.set('sys:children', yChildren);
  if (Array.isArray(props.children)) {
    props.children.forEach(child => yChildren.push([child.id]));
  }
}

export function syncBlockProps(
  schema: z.infer<typeof BlockSchema>,
  defaultProps: Record<string, unknown>,
  yBlock: YBlock,
  props: Partial<BlockProps>,
  ignoredKeys: Set<string>
) {
  const propSchema = schema.model.props(internalPrimitives);
  Object.entries(props).forEach(([key, value]) => {
    if (SYS_KEYS.has(key) || ignoredKeys.has(key)) return;

    const isText = propSchema[key] instanceof Text;
    if (isText) {
      if (value instanceof Text) {
        yBlock.set(`prop:${key}`, value.yText);
      } else {
        // When copying the database, the value of title is a string
        yBlock.set(`prop:${key}`, new Y.Text(value));
      }
      return;
    }
    if (!isPrimitive(value) && !Array.isArray(value)) {
      throw new Error('Only top level primitives are supported for now');
    }

    if (value !== undefined) {
      if (Array.isArray(value)) {
        yBlock.set(`prop:${key}`, Y.Array.from(value));
      } else {
        yBlock.set(`prop:${key}`, value);
      }
    }
  });

  // set default value
  Object.entries(defaultProps).forEach(([key, value]) => {
    if (!yBlock.has(`prop:${key}`)) {
      if (value instanceof Text) {
        yBlock.set(`prop:${key}`, new Y.Text());
      } else if (Array.isArray(value)) {
        yBlock.set(`prop:${key}`, Y.Array.from(value));
      } else {
        yBlock.set(`prop:${key}`, value);
      }
    }
  });
}

export function toBlockProps(yBlock: YBlock): Partial<BlockProps> {
  const prefixedProps = yBlock.toJSON() as PrefixedBlockProps;
  const props: Partial<BlockProps> = {};
  Object.keys(prefixedProps).forEach(key => {
    if (prefixedProps[key]) {
      props[key.replace('sys:', '')] = prefixedProps[key];
    }
  });

  Object.keys(prefixedProps).forEach(prefixedKey => {
    if (SYS_KEYS.has(prefixedKey)) return;

    const key = prefixedKey.replace('prop:', '');
    const realValue = yBlock.get(prefixedKey);
    if (realValue instanceof Y.Array) {
      props[key] = realValue.toArray();
    } else {
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

export function doesInsideBlockByFlavour(
  page: Page,
  block: BaseBlockModel | string,
  flavour: keyof BlockModels
): boolean {
  const parent = page.getParent(block);
  if (parent === null) {
    return false;
  } else if (matchFlavours(parent, [flavour])) {
    return true;
  }
  return doesInsideBlockByFlavour(page, parent, flavour);
}
