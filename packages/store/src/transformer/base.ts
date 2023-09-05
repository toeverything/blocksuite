import { z } from 'zod';

import type { BaseBlockModel } from '../schema/index.js';
import type { AssetsManager } from './assets.js';
import { fromJSON, toJSON } from './json.js';

export type BlockSnapshot = {
  id: string;
  flavour: string;
  props: Record<string, unknown>;
  children: BlockSnapshot[];
};

type BlockSnapshotLeaf = Omit<BlockSnapshot, 'children'>;

export const BlockSnapshotSchema: z.ZodType<BlockSnapshot> = z.object({
  id: z.string(),
  flavour: z.string(),
  props: z.record(z.unknown()),
  children: z.lazy(() => BlockSnapshotSchema.array()),
});

type FromSnapshotPayload = {
  json: BlockSnapshotLeaf;
  assets: AssetsManager;
};

type ToSnapshotPayload<Model extends BaseBlockModel> = {
  model: Model;
  assets: AssetsManager;
};

type ModelToSnapshotReturn<T extends BaseBlockModel> = T extends BaseBlockModel<
  infer Props
>
  ? { id: string; flavour: string; props: Props }
  : never;

export class BaseBlockTransformer<
  Model extends BaseBlockModel = BaseBlockModel,
> {
  protected _propsFromSnapshot(propsJson: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(propsJson).map(([key, value]) => {
        return [key, fromJSON(value)];
      })
    );
  }

  protected _propsToSnapshot(model: Model) {
    return Object.fromEntries(
      model.keys.map(key => {
        const value = model[key as keyof typeof model];
        return [key, toJSON(value)];
      })
    );
  }
  async fromSnapshot({
    json,
  }: FromSnapshotPayload): Promise<ModelToSnapshotReturn<Model>> {
    const { flavour, id, props: _props } = json;

    const props = this._propsFromSnapshot(_props);

    return {
      id,
      flavour,
      props,
    } as ModelToSnapshotReturn<Model>;
  }

  async toSnapshot({
    model,
  }: ToSnapshotPayload<Model>): Promise<BlockSnapshotLeaf> {
    const { id, flavour } = model;

    const props = this._propsToSnapshot(model);

    return {
      id,
      flavour,
      props,
    };
  }
}
