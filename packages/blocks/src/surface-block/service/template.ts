import { assertType, Slot } from '@blocksuite/global/utils';
import type { BaseBlockModel, Boxed, Y } from '@blocksuite/store';
import {
  type BlockSnapshot,
  Job,
  type PageSnapshot,
  PageSnapshotSchema,
  type SnapshotReturn,
  Workspace,
} from '@blocksuite/store';

import { Bound, getCommonBound } from '../index.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import { replaceIdMiddleware } from './template-middlewares.js';

/**
 * Those block contains other block's id
 * should defer the loading
 */
const DEFERED_BLOCK = ['affine:surface', 'affine:surface-ref'] as const;

/**
 * Those block should not be inserted directly
 * it should be merged with current existing block
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
    blockJson: BlockSnapshot;
    parent?: string;
    index?: number;
  };
};

export type SlotPayload =
  | SlotBlockPayload
  | {
      type: 'template';
      template: PageSnapshot;
      bound: Bound | null;
    };

export type TemplateJobConfig = {
  model: SurfaceBlockModel;
  type: TemplateType;
  middlewares: ((job: TemplateJob) => void)[];
};

export class TemplateJob {
  static create(options: {
    model: SurfaceBlockModel;
    type: TemplateType;
    middlewares: ((job: TemplateJob) => void)[];
  }) {
    return new TemplateJob(options);
  }

  static middlewares = [replaceIdMiddleware];

  job: Job;
  model: SurfaceBlockModel;
  type: TemplateType;

  slots = {
    beforeInsert: new Slot<
      | SlotBlockPayload
      | {
          type: 'template';
          template: PageSnapshot;
          bound: Bound | null;
        }
    >(),
  };

  constructor({ model, type, middlewares }: TemplateJobConfig) {
    this.job = new Job({ workspace: model.page.workspace, middlewares: [] });
    this.model = model;
    this.type = type;

    middlewares.forEach(middleware => middleware(this));
    TemplateJob.middlewares.forEach(middleware => middleware(this));
  }

  private _mergeElements(from: Boxed<Y.Map<unknown>>, to: Y.Map<unknown>) {
    const tempDoc = new Workspace.Y.Doc();
    tempDoc.getMap('temp').set('from', from.yMap);

    const defered: [string, unknown][] = [];

    from.yMap.get('value')!.forEach((val, key) => {
      if (
        ['connector', 'group'].includes(
          (val as Y.Map<unknown>).get('type') as string
        )
      ) {
        defered.push([key, val]);
        return;
      }

      to.set(key, (val as Y.Map<unknown>).clone());
    });

    defered.forEach(([key, val]) => {
      to.set(key, (val as Y.Map<unknown>).clone());
    });
  }

  private _mergeProps(from: SnapshotReturn<object>, to: BaseBlockModel) {
    switch (from.flavour as MergeBlockFlavour) {
      case 'affine:page':
        break;
      case 'affine:surface':
        this._mergeElements(
          (
            from as SnapshotReturn<{
              elements: Boxed<Y.Map<unknown>>;
            }>
          ).props.elements,
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

  getTemplateBound(template: PageSnapshot) {
    const bounds: Bound[] = [];

    const iterate = (block: BlockSnapshot) => {
      if (block.props.xywh) {
        bounds.push(Bound.deserialize(block.props['xywh'] as string));
      }

      if (block.flavour === 'affine:surface') {
        Object.entries(
          block.props.elements as Record<string, Record<string, unknown>>
        ).forEach(([_, val]) => {
          if (val['xywh']) {
            bounds.push(Bound.deserialize(val['xywh'] as string));
          }
        });
      }

      if (block.children) {
        block.children.forEach(iterate);
      }
    };

    iterate(template.blocks);

    return getCommonBound(bounds);
  }

  async insertTemplate(template: unknown) {
    PageSnapshotSchema.parse(template);

    assertType<PageSnapshot>(template);

    const templateBound = this.getTemplateBound(template);

    this.slots.beforeInsert.emit({
      type: 'template',
      template: template,
      bound: templateBound,
    });

    const { model, job } = this;
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

      const slotData = {
        blockJson: snapshot,
        parent,
        index,
      };

      this.slots.beforeInsert.emit({ type: 'block', data: slotData });

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

    const mergeIdMapping = new Map<string, string>();
    const mergeBlocks: SnapshotReturn<object>[] = [];

    blockList.forEach(block => {
      const { modelData, parent, index } = block;

      if (MERGE_BLOCK.includes(modelData.flavour as MergeBlockFlavour)) {
        mergeIdMapping.set(modelData.id, this._getMergeBlockId(modelData));
        mergeBlocks.push(modelData);
        return;
      }

      model.page.addBlock(
        modelData.flavour,
        {
          ...modelData.props,
          id: modelData.id,
        },
        parent ? mergeIdMapping.get(parent) ?? parent : undefined,
        index
      );
    });

    mergeBlocks.forEach(modelData => {
      this._mergeProps(
        modelData,
        this.model.page.getBlockById(
          this._getMergeBlockId(modelData)
        ) as BaseBlockModel
      );
    });

    return templateBound;
  }
}
