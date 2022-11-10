import type { BlockSchema } from '@blocksuite/editor';
import type { Signal, Space } from '@blocksuite/store';

type Schema = typeof BlockSchema;

// Borrowed from zod
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace objectUtils {
  type noNeverKeys<T> = {
    [k in keyof T]: [T[k]] extends [never] ? never : k;
  }[keyof T];
  /** Remove object entries in type where value is typed as `never` */
  export type noNever<T> = {
    [k in noNeverKeys<T>]: k extends keyof T ? T[k] : never;
  };
}

/** MVP helper for narrowing down the likely configurable attributes */
type ConfigurableTypes<T> = objectUtils.noNever<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof T]: T[P] extends ((...any: any) => any) | Signal | Map<any, any>
    ? never
    : T[P];
}>;

/** Ergonomic and okay-ish-typed helper for creating initial document states. */
// Dev note: DO NOT specify the return types, as it greatly complicates this code.
// TypeScript will do fine to infer all these complex recursive types.
export const init = {
  fromSpace(space: Space) {
    return {
      addPage(
        attrs?: Partial<ConfigurableTypes<InstanceType<Schema['affine:page']>>>
      ) {
        const pageId = space.addBlock({ flavour: 'affine:page', ...attrs });
        return init.fromBlockId(space, pageId, 'affine:page');
      },
    };
  },
  // Tracking K here and other places is really important to
  // ensure that all places in TypeScript are typed nicely.
  fromBlockId<K extends keyof Schema>(
    space: Space,
    blockId: string,
    // not used, only needed for determining the Schema type.
    _flavour: K
  ) {
    type BlockInstance = InstanceType<Schema[K]>;
    const block = space.getBlockById(blockId) as BlockInstance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return init.fromModel<K>(block as any);
  },
  fromModel<K extends keyof Schema>(model: {
    space: Space;
    flavour: K;
    id: string;
  }) {
    type BlockInstance = InstanceType<Schema[K]>;
    const block = model as BlockInstance;
    // Tracking K here is important to ensure that
    // TypeScript return types are typed nicely (like in `self()` and nested `addChild()`s).
    /** Returns wrapper of created block */
    function addChild<K extends keyof Schema>(
      flavour: K,
      attrs: Partial<Omit<InstanceType<Schema[K]>, 'flavour'>> = {}
    ) {
      const childId = block.space.addBlock(
        {
          flavour,
          ...attrs,
        },
        block.id
      );
      return init.fromBlockId(block.space, childId, flavour);
    }
    function self(fn: (block: typeof b) => void) {
      fn(b);
      return b;
    }
    const b = {
      /** The underlying model like {@link PageBlockModel} or {@link ListBlockModel}, etc.*/
      model: block,
      /** Set a specific attribute on the model directly (model[attr] = value). */
      set<A extends keyof BlockInstance>(attr: A, value: BlockInstance[A]) {
        block[attr] = value;
        return b;
      },
      /**
       * Append text to this block with optional attributes.
       * @remarks
       * Maybe not all blocks have text, so you cannot always be certain
       * this will work for every block.
       */
      withText(text: string, attrs?: Record<string, unknown>) {
        if (block.text) {
          block.text.insert(text, block.text.length, attrs);
        }
        return b;
      },
      /** Returns wrapper for created block */
      addChild,
      /**
       * Run a function passing in self, returning self.
       * This can make it easier to read and write nested block items.
       */
      self,
    };
    return b;
  },
};
