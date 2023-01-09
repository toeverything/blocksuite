import * as Y from 'yjs';
import type { BaseBlockModel, BlockModels } from '../base.js';
import type {
  BlockProps,
  PrefixedBlockProps,
  YBlock,
  YBlocks,
} from '../workspace/page.js';
import { PrelimText, Text, TextType } from '../text-adapter.js';
import type { Workspace } from '../workspace/index.js';
import { fromBase64, toBase64 } from 'lib0/buffer.js';

const SYS_KEYS = new Set(['id', 'flavour', 'children']);

// https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object
function isPrimitive(
  a: unknown
): a is null | undefined | boolean | number | string {
  return a !== Object(a);
}

export function assertExists<T>(val: T | null | undefined): asserts val is T {
  if (val === null || val === undefined) {
    throw new Error('val does not exist');
  }
}

export function assertFlavours<
  Key extends keyof BlockModels & string = keyof BlockModels & string
>(model: BaseBlockModel, allowed: Key[]) {
  if (!allowed.includes(model.flavour as Key)) {
    throw new Error(`model flavour ${model.flavour} is not allowed`);
  }
}

export function matchFlavours<
  Key extends keyof BlockModels & string = keyof BlockModels & string
>(model: BaseBlockModel, expected: Key[]): model is BlockModels[Key] {
  return expected.includes(model.flavour as Key);
}

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

export function initSysProps(yBlock: YBlock, props: Partial<BlockProps>) {
  yBlock.set('sys:id', props.id);
  yBlock.set('sys:flavour', props.flavour);

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

    if (!isPrimitive(props[key])) {
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

    // attach meta state for identifing split
    // otherwise local change from y-side will be ignored by TextAdapter
    // @ts-ignore
    yBase.meta = { split: true };

    // clone the original text to `yRight` and add it to the doc first
    const yRight = yBase.clone();
    yBlock.set('prop:text', yRight);

    // delete the left-half part of `yRight`, making it the new right
    yRight.delete(0, right.index);

    // delete the right-half part of `yBase`, making it the new left
    yBase.delete(right.index, yBase.length - right.index);

    // cleanup
    splitSet.clear();
  }
}

export function toBlockProps(
  prefixedProps: PrefixedBlockProps
): Partial<BlockProps> {
  const props: Partial<BlockProps> = {};
  Object.keys(prefixedProps).forEach(key => {
    if (prefixedProps[key]) {
      props[key.replace('sys:', '')] = prefixedProps[key];
    }
  });

  Object.keys(prefixedProps).forEach(prefixedKey => {
    if (SYS_KEYS.has(prefixedKey)) return;

    const key = prefixedKey.replace('prop:', '');
    props[key] = prefixedProps[prefixedKey];
  });

  return props;
}

export function encodeWorkspaceAsYjsUpdateV2(workspace: Workspace): string {
  return toBase64(Y.encodeStateAsUpdateV2(workspace.doc));
}

export function applyYjsUpdateV2(workspace: Workspace, update: string): void {
  Y.applyUpdateV2(workspace.doc, fromBase64(update));
}
