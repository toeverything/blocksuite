import type {
  FromSnapshotPayload,
  SnapshotReturn,
  ToSnapshotPayload,
  Y,
} from '@blocksuite/store';
import { BaseBlockTransformer, Workspace } from '@blocksuite/store';

import type { SurfaceBlockProps } from './surface-model.js';

const SURFACE_TEXT_UNIQ_IDENTIFIER = 'affine:surface:text';

export class SurfaceBlockTransformer extends BaseBlockTransformer<SurfaceBlockProps> {
  private _toJSON(value: unknown): unknown {
    if (value instanceof Workspace.Y.Text) {
      return {
        [SURFACE_TEXT_UNIQ_IDENTIFIER]: true,
        delta: value.toDelta(),
      };
    }
    return value;
  }

  private _fromJSON(value: unknown): unknown {
    if (value instanceof Object) {
      if (Reflect.has(value, SURFACE_TEXT_UNIQ_IDENTIFIER)) {
        const yText = new Workspace.Y.Text();
        yText.applyDelta(Reflect.get(value, 'delta'));
        return yText;
      }
    }
    return value;
  }

  private _elementToJSON(element: Y.Map<unknown>) {
    const value: Record<string, unknown> = {};
    element.forEach((_value, _key) => {
      value[_key] = this._toJSON(_value);
    });

    return value;
  }

  private _elementFromJSON(element: Record<string, unknown>) {
    const yMap = new Workspace.Y.Map();
    Object.entries(element).forEach(([key, value]) => {
      yMap.set(key, this._fromJSON(value));
    });

    return yMap;
  }

  override async toSnapshot(payload: ToSnapshotPayload<SurfaceBlockProps>) {
    const snapshot = await super.toSnapshot(payload);
    const elementsValue = payload.model.elements.getValue();
    const value: Record<string, unknown> = {};
    if (elementsValue) {
      elementsValue.forEach((element, key) => {
        value[key] = this._elementToJSON(element as Y.Map<unknown>);
      });
    }
    snapshot.props = {
      elements: value,
    };

    return snapshot;
  }

  override async fromSnapshot(
    payload: FromSnapshotPayload
  ): Promise<SnapshotReturn<SurfaceBlockProps>> {
    const snapshotRet = await super.fromSnapshot(payload);
    const elementsJSON = snapshotRet.props.elements as unknown as Record<
      string,
      unknown
    >;
    const yMap = new Workspace.Y.Map();

    Object.entries(elementsJSON).forEach(([key, value]) => {
      const element = this._elementFromJSON(value as Record<string, unknown>);
      yMap.set(key, element);
    });

    const elements = this._internal.Native(yMap);

    snapshotRet.props = {
      elements,
    };

    return snapshotRet;
  }
}
