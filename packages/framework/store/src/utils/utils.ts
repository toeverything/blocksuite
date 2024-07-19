import type { z } from 'zod';

import { toBase64 } from 'lib0/buffer.js';
import * as Y from 'yjs';

import type { BlockModel } from '../schema/base.js';
import type { BlockSchema } from '../schema/base.js';
import type { YBlock } from '../store/doc/block/index.js';
import type { BlockProps, YBlocks } from '../store/doc/block-collection.js';
import type { DocCollection } from '../store/index.js';

import { SYS_KEYS } from '../consts.js';
import { native2Y } from '../reactive/index.js';
import { internalPrimitives } from '../schema/base.js';

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
  model: BlockModel,
  yBlock: YBlock,
  props: Partial<BlockProps>
) {
  const defaultProps = schema.model.props?.(internalPrimitives) ?? {};

  Object.entries(props).forEach(([key, value]) => {
    if (SYS_KEYS.has(key)) return;
    if (value === undefined) return;

    // @ts-ignore
    model[key] = value;
  });

  // set default value
  Object.entries(defaultProps).forEach(([key, value]) => {
    const notExists =
      !yBlock.has(`prop:${key}`) || yBlock.get(`prop:${key}`) === undefined;
    if (!notExists) {
      return;
    }

    // @ts-ignore
    model[key] = native2Y(value);
  });
}

export function encodeCollectionAsYjsUpdateV2(
  collection: DocCollection
): string {
  return toBase64(Y.encodeStateAsUpdateV2(collection.doc));
}

export const hash = (str: string) => {
  return str
    .split('')
    .reduce(
      (prevHash, currVal) =>
        ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0,
      0
    );
};
