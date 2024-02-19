import type { BlockModel, InternalPrimitives } from '../schema/index.js';
import { internalPrimitives } from '../schema/index.js';
import type { AssetsManager } from './assets.js';
import { fromJSON, toJSON } from './json.js';
import type { BlockSnapshot } from './type.js';

type BlockSnapshotLeaf = Pick<
  BlockSnapshot,
  'id' | 'flavour' | 'props' | 'version'
>;

export type FromSnapshotPayload = {
  json: BlockSnapshotLeaf;
  assets: AssetsManager;
  children: BlockSnapshot[];
};

export type ToSnapshotPayload<Props extends object> = {
  model: BlockModel<Props>;
  assets: AssetsManager;
};

export type SnapshotReturn<Props extends object> = {
  id: string;
  flavour: string;
  version: number;
  props: Props;
};

export class BaseBlockTransformer<Props extends object = object> {
  protected _internal: InternalPrimitives = internalPrimitives;

  protected _propsFromSnapshot(propsJson: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(propsJson).map(([key, value]) => {
        return [key, fromJSON(value)];
      })
    ) as Props;
  }

  protected _propsToSnapshot(model: BlockModel) {
    return Object.fromEntries(
      model.keys.map(key => {
        const value = model[key as keyof typeof model];
        return [key, toJSON(value)];
      })
    );
  }

  fromSnapshot({
    json,
  }: FromSnapshotPayload):
    | Promise<SnapshotReturn<Props>>
    | SnapshotReturn<Props> {
    const { flavour, id, version, props: _props } = json;

    const props = this._propsFromSnapshot(_props);

    return {
      id,
      flavour,
      version: version ?? -1,
      props,
    };
  }

  toSnapshot({
    model,
  }: ToSnapshotPayload<Props>): Promise<BlockSnapshotLeaf> | BlockSnapshotLeaf {
    const { id, flavour, version } = model;

    const props = this._propsToSnapshot(model);

    return {
      id,
      flavour,
      version,
      props,
    };
  }
}
