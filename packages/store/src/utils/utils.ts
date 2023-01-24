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
  yBlock: YBlock,
  props: Partial<BlockProps>,
  ignoredKeys: Set<string>
) {
  Object.keys(props).forEach(key => {
    if (SYS_KEYS.has(key) || ignoredKeys.has(key)) return;

    // TODO use schema
    if (key === 'text') return;
    if (!isPrimitive(props[key]) && !Array.isArray(props[key])) {
      throw new Error('Only top level primitives are supported for now');
    }

    // TODO compare with current yBlock value
    if (props[key] !== undefined) {
      yBlock.set('prop:' + key, props[key]);
    }
  });

  // TODO use schema
  if (
    props.flavour === 'affine:paragraph' &&
    !props.type &&
    !yBlock.has('prop:type')
  ) {
    yBlock.set('prop:type', 'text');
  }
  if (props.flavour === 'affine:list' && !yBlock.has('prop:type')) {
    yBlock.set('prop:type', props.type ?? 'bulleted');
  }

  if (props.flavour === 'affine:list' && !yBlock.has('prop:checked')) {
    yBlock.set('prop:checked', props.checked ?? false);
  }
  if (props.flavour === 'affine:frame' && !yBlock.has('prop:xywh')) {
    yBlock.set('prop:xywh', props.xywh ?? '[0,0,720,480]');
  }
  if (props.flavour === 'affine:embed' && !yBlock.has('prop:width')) {
    yBlock.set('prop:width', props.width ?? 20);
  }
  if (props.flavour === 'affine:embed' && !yBlock.has('prop:sourceId')) {
    yBlock.set('prop:sourceId', props.sourceId ?? '');
  }
  if (props.flavour === 'affine:embed' && !yBlock.has('prop:caption')) {
    yBlock.set('prop:caption', props.caption ?? '');
  }
  if (props.flavour === 'affine:shape') {
    if (!yBlock.has('prop:xywh')) {
      yBlock.set('prop:xywh', props.xywh ?? '[0,0,50,50]');
    }
    if (!yBlock.has('prop:type')) {
      yBlock.set('prop:type', props.type ?? 'rectangle');
    }
    if (!yBlock.has('prop:color')) {
      yBlock.set('prop:color', props.color ?? 'black');
    }
  }
  if (props.flavour === 'affine:database') {
    if (!yBlock.has('prop:columns')) {
      const columns = Y.Array.from(props.columns ?? []);
      yBlock.set('prop:columns', columns);
    }
    if (!yBlock.has('prop:title')) {
      yBlock.set('prop:title', '');
    }
  }
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
