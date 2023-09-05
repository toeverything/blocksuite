import type { BaseBlockModel } from '../schema/index.js';
import type { AssetsManager } from './assets.js';
import { fromJSON, toJSON } from './json.js';
import type { BlockSnapshot } from './type.js';

type BlockSnapshotLeaf = Omit<BlockSnapshot, 'children'>;

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
