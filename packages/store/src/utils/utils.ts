import * as Y from 'yjs';
import type { BlockProps, PrefixedBlockProps, YBlock } from '../store';
import { PrelimTextEntity, TextEntity, TextType } from '../text-adapter';

const SYS_KEYS = new Set(['id', 'flavour', 'children']);

// https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object
function isPrimitive(
  a: unknown
): a is null | undefined | boolean | number | string {
  return a !== Object(a);
}

export function initSysProps(yBlock: YBlock, props: Partial<BlockProps>) {
  yBlock.set('sys:id', props.id);
  yBlock.set('sys:flavour', props.flavour);
  yBlock.set('sys:children', new Y.Array());
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
    props.flavour === 'paragraph' &&
    !props.type &&
    !yBlock.has('prop:type')
  ) {
    yBlock.set('prop:type', 'text');
  }
  // TODO use schema
  if (props.flavour === 'list' && !props.type && !yBlock.has('prop:type')) {
    yBlock.set('prop:type', 'bulleted');
  }
}

export function trySyncTextProp(
  splitSet: Set<TextEntity | PrelimTextEntity>,
  yBlock: YBlock,
  text?: TextType | void
) {
  if (!text) return;

  // update by clone
  if (text instanceof TextEntity) {
    // @ts-ignore
    yBlock.set('prop:text', text._yText);
    return;
  }

  // update by split
  if (text instanceof PrelimTextEntity) {
    const iter = splitSet.values();
    const base = iter.next().value as TextEntity;
    const left = iter.next().value as PrelimTextEntity;
    const right = iter.next().value as PrelimTextEntity;

    if (!left.ready) {
      throw new Error('PrelimTextEntity left is not ready');
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
