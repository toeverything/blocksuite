import * as Y from 'yjs';
import type {
  BlockProps,
  PrefixedBlockProps,
  YBlock,
  YBlocks,
} from '../workspace/page.js';
import { PrelimText, Text, TextType } from '../text-adapter.js';
import type { Workspace } from '../workspace/index.js';
import { fromBase64, toBase64 } from 'lib0/buffer.js';
import { isPrimitive, matchFlavours, SYS_KEYS } from '@blocksuite/global/utils';
import type { Page } from '../workspace/page.js';
import type { BaseBlockModel } from '../base.js';
import type { z } from 'zod';
import type { BlockSchema } from '../base.js';

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
    yBlock.set('meta:tags', new Y.Map());
    yBlock.set('meta:tagSchema', new Y.Map());
  }

  const yChildren = new Y.Array();
  yBlock.set('sys:children', yChildren);
  if (Array.isArray(props.children)) {
    props.children.forEach(child => yChildren.push([child.id]));
  }
}

export function syncBlockProps(
  // schema: z.infer<typeof BlockSchema>,
  defaultState: Record<string, unknown>,
  yBlock: YBlock,
  props: Partial<BlockProps>,
  ignoredKeys: Set<string>
) {
  Object.keys(props).forEach(key => {
    if (SYS_KEYS.has(key) || ignoredKeys.has(key)) return;
    const value = props[key];

    // TODO use schema
    if (key === 'text') return;
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
  Object.entries(defaultState).forEach(([key, value]) => {
    if (!yBlock.has(`prop:${key}`)) {
      if (Array.isArray(value)) {
        yBlock.set(`prop:${key}`, Y.Array.from(value));
      } else {
        yBlock.set(`prop:${key}`, value);
      }
    }
  });
}

export function trySyncTextProp(
  splitSet: Set<Text | PrelimText>,
  yBlock: YBlock,
  text?: TextType | void
) {
  if (!text) return;

  // update by clone
  if (text instanceof Text) {
    // @ts-ignore
    yBlock.set('prop:text', text._yText);
    return;
  }

  // update by split
  if (text instanceof PrelimText) {
    const iter = splitSet.values();
    const base = iter.next().value as Text;
    const left = iter.next().value as PrelimText;
    const right = iter.next().value as PrelimText;

    if (!left.ready) {
      throw new Error('PrelimText left is not ready');
    }
    if (
      left.type !== 'splitLeft' ||
      right.type !== 'splitRight' ||
      right !== text
    ) {
      throw new Error('Unmatched text entity');
    }

    // @ts-ignore
    const yBase = base._yText;

    // attach meta state for identifying split
    // otherwise local change from y-side will be ignored by TextAdapter
    // @ts-ignore
    yBase.meta = { split: true };

    // clone the original text to `yRight` and add it to the doc first
    const yRight = yBase.clone();
    yBlock.set('prop:text', yRight);

    // delete the left-half part of `yRight`, making it the new right
    yRight.delete(0, right.index);

    // delete the right-half part of `yBase`, making it the new left
    yBase.delete(left.index, yBase.length - left.index);

    // cleanup
    splitSet.clear();
  }
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
  block: BaseBlockModel,
  flavour: keyof BlockSuiteInternal.BlockModels
): boolean {
  const parent = page.getParent(block);
  if (parent === null) {
    return false;
  } else if (matchFlavours(parent, [flavour])) {
    return true;
  }
  return doesInsideBlockByFlavour(page, parent, flavour);
}
