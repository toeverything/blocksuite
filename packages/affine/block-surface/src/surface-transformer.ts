import type { SurfaceBlockProps } from '@blocksuite/block-std/gfx';
import type {
  FromSnapshotPayload,
  SnapshotReturn,
  ToSnapshotPayload,
  Y,
} from '@blocksuite/store';

import { BaseBlockTransformer, DocCollection } from '@blocksuite/store';

const SURFACE_TEXT_UNIQ_IDENTIFIER = 'affine:surface:text';
// Used for group children field
const SURFACE_YMAP_UNIQ_IDENTIFIER = 'affine:surface:ymap';

export class SurfaceBlockTransformer extends BaseBlockTransformer<SurfaceBlockProps> {
  private _elementToJSON(element: Y.Map<unknown>) {
    const value: Record<string, unknown> = {};
    element.forEach((_value, _key) => {
      value[_key] = this._toJSON(_value);
    });

    return value;
  }

  private _fromJSON(value: unknown): unknown {
    if (value instanceof Object) {
      if (Reflect.has(value, SURFACE_TEXT_UNIQ_IDENTIFIER)) {
        const yText = new DocCollection.Y.Text();
        yText.applyDelta(Reflect.get(value, 'delta'));
        return yText;
      } else if (Reflect.has(value, SURFACE_YMAP_UNIQ_IDENTIFIER)) {
        const yMap = new DocCollection.Y.Map();
        const json = Reflect.get(value, 'json') as Record<string, unknown>;
        Object.entries(json).forEach(([key, value]) => {
          yMap.set(key, value);
        });
        return yMap;
      }
    }
    return value;
  }

  private _toJSON(value: unknown): unknown {
    if (value instanceof DocCollection.Y.Text) {
      return {
        [SURFACE_TEXT_UNIQ_IDENTIFIER]: true,
        delta: value.toDelta(),
      };
    } else if (value instanceof DocCollection.Y.Map) {
      return {
        [SURFACE_YMAP_UNIQ_IDENTIFIER]: true,
        json: value.toJSON(),
      };
    }
    return value;
  }

  elementFromJSON(element: Record<string, unknown>) {
    const yMap = new DocCollection.Y.Map();
    Object.entries(element).forEach(([key, value]) => {
      yMap.set(key, this._fromJSON(value));
    });

    return yMap;
  }

  override async fromSnapshot(
    payload: FromSnapshotPayload
  ): Promise<SnapshotReturn<SurfaceBlockProps>> {
    const snapshotRet = await super.fromSnapshot(payload);
    const elementsJSON = snapshotRet.props.elements as unknown as Record<
      string,
      unknown
    >;
    const yMap = new DocCollection.Y.Map<Y.Map<unknown>>();

    Object.entries(elementsJSON).forEach(([key, value]) => {
      const element = this.elementFromJSON(value as Record<string, unknown>);

      yMap.set(key, element);
    });

    const elements = this._internal.Boxed(yMap);

    snapshotRet.props = {
      elements,
    };

    return snapshotRet;
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
}
