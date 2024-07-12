import type { BlockModel, InternalPrimitives } from '../schema/index.js';
import type { AssetsManager } from './assets.js';
import type { DraftModel } from './draft.js';
import type { BlockSnapshot } from './type.js';

import { internalPrimitives } from '../schema/index.js';
import { fromJSON, toJSON } from './json.js';

type BlockSnapshotLeaf = Pick<
  BlockSnapshot,
  'flavour' | 'id' | 'props' | 'version'
>;

export type FromSnapshotPayload = {
  assets: AssetsManager;
  children: BlockSnapshot[];
  json: BlockSnapshotLeaf;
};

export type ToSnapshotPayload<Props extends object> = {
  assets: AssetsManager;
  model: DraftModel<BlockModel<Props>>;
};

export type SnapshotReturn<Props extends object> = {
  flavour: string;
  id: string;
  props: Props;
  version: number;
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

  protected _propsToSnapshot(model: DraftModel) {
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
    const { flavour, id, props: _props, version } = json;

    const props = this._propsFromSnapshot(_props);

    return {
      flavour,
      id,
      props,
      version: version ?? -1,
    };
  }

  toSnapshot({
    model,
  }: ToSnapshotPayload<Props>): BlockSnapshotLeaf | Promise<BlockSnapshotLeaf> {
    const { flavour, id, version } = model;

    const props = this._propsToSnapshot(model);

    return {
      flavour,
      id,
      props,
      version,
    };
  }
}
