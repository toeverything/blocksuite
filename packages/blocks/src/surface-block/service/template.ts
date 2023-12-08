import { assertType, Slot } from '@blocksuite/global/utils';
import type { BaseBlockModel, Boxed, Y } from '@blocksuite/store';
import {
  type BlockSnapshot,
  Job,
  type PageSnapshot,
  PageSnapshotSchema,
  type SnapshotReturn,
} from '@blocksuite/store';

import type { SurfaceBlockModel } from '../surface-model.js';
import { replaceIdMiddleware } from './template-middlewares.js';

/**
 * Those block contains other block's id
 * should defer the loading
 */
const DEFERED_BLOCK = ['affine:surface', 'affine:surface-ref'] as const;

/**
 * Those block should not be inserted directly
 * it should merge with current existing block
 */
const MERGE_BLOCK = ['affine:surface', 'affine:page'] as const;

type MergeBlockFlavour = (typeof MERGE_BLOCK)[number];

/**
 * Template type will affect the inserting behaviour
 */
type TemplateType = 'edgeless-template' | 'sticker';

export type SlotBlockPayload = {
  type: 'block';
  data: {
    modelData: SnapshotReturn<object>;
    parent?: string;
    index?: number;
  };
};

export type SlotPayload =
  | SlotBlockPayload
  | {
      type: 'template';
      template: PageSnapshot;
    };

export type TemplateJobConfig = {
  model: SurfaceBlockModel;
  type: TemplateType;
};

export class TemplateJob {
  static beforeHookCtr = [replaceIdMiddleware];

  static create(model: SurfaceBlockModel, type: TemplateType) {
    return new TemplateJob({ model, type });
  }

  static middlewares = [replaceIdMiddleware];

  model: SurfaceBlockModel;

  type: TemplateType;

  slots = {
    beforeInsert: new Slot<
      | {
          type: 'block';
          data: {
            modelData: SnapshotReturn<object>;
            parent?: string;
            index?: number;
          };
        }
      | {
          type: 'template';
          template: PageSnapshot;
        }
    >(),
  };

  constructor({ model, type }: TemplateJobConfig) {
    this.model = model;
    this.type = type;

    TemplateJob.middlewares.forEach(middleware => middleware(this));
  }

  private _mergeElements(from: Y.Map<unknown>, to: Y.Map<unknown>) {
    from.forEach((val, key) => {
      to.set(key, val);
    });
  }

  private _mergeBlock(from: SnapshotReturn<object>, to: BaseBlockModel) {
    switch (from.flavour as MergeBlockFlavour) {
      case 'affine:page':
        break;
      case 'affine:surface':
        this._mergeElements(
          (
            from as SnapshotReturn<{
              elements: Boxed<Y.Map<unknown>>;
            }>
          ).props.elements.getValue()!,
          (to as SurfaceBlockModel).elements.getValue()!
        );
        break;
    }
  }

  private _getMergeBlockId(modelData: SnapshotReturn<object>) {
    switch (modelData.flavour as MergeBlockFlavour) {
      case 'affine:page':
        return this.model.page.root!.id;
      case 'affine:surface':
        return this.model.id;
    }
  }

  async insertTemplate(template: unknown) {
    PageSnapshotSchema.parse(template);

    assertType<PageSnapshot>(template);

    this.slots.beforeInsert.emit({
      type: 'template',
      template: template,
    });

    const { model } = this;
    const defered: {
      snapshot: BlockSnapshot;
      parent?: string;
      index?: number;
    }[] = [];
    const blockList: {
      modelData: SnapshotReturn<object>;
      parent?: string;
      index?: number;
    }[] = [];
    const job = new Job({
      workspace: this.model.page.workspace,
      middlewares: [],
    });
    const toModel = async (
      snapshot: BlockSnapshot,
      parent?: string,
      index?: number,
      defer: boolean = true
    ) => {
      if (
        defer &&
        DEFERED_BLOCK.includes(
          snapshot.flavour as (typeof DEFERED_BLOCK)[number]
        )
      ) {
        defered.push({
          snapshot,
          parent,
          index,
        });
        return;
      }

      const modelData = await job.snapshotToModelData(snapshot);

      blockList.push({
        modelData,
        parent,
        index,
      });

      if (snapshot.children) {
        let index = 0;
        for (const child of snapshot.children) {
          await toModel(child, snapshot.id, index);
          ++index;
        }
      }
    };

    await toModel(template.blocks);

    for (const block of defered) {
      await toModel(block.snapshot, block.parent, block.index, false);
    }

    const mergeBlockMap = new Map<string, string>();

    blockList.forEach(block => {
      this.slots.beforeInsert.emit({ type: 'block', data: block });

      const { modelData, parent, index } = block;

      if (MERGE_BLOCK.includes(modelData.flavour as MergeBlockFlavour)) {
        const targetBlockId = this._getMergeBlockId(modelData);
        mergeBlockMap.set(modelData.id, targetBlockId);

        this._mergeBlock(
          modelData,
          this.model.page.getBlockById(targetBlockId) as BaseBlockModel
        );

        return;
      }

      model.page.addBlock(
        modelData.flavour,
        {
          ...modelData.props,
          id: modelData.id,
        },
        parent ? mergeBlockMap.get(parent) ?? parent : undefined,
        index
      );
    });
  }
}
