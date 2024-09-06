import type { ConnectorElementModel } from '@blocksuite/affine-model';
import type { SurfaceBlockProps } from '@blocksuite/block-std/gfx';
import type { MigrationRunner, Y } from '@blocksuite/store';

import { SurfaceBlockModel as BaseSurfaceModel } from '@blocksuite/block-std/gfx';
import { DisposableGroup } from '@blocksuite/global/utils';
import {
  Boxed,
  defineBlockSchema,
  DocCollection,
  Text,
} from '@blocksuite/store';

import { elementsCtorMap } from './element-model/index.js';
import { connectorMiddleware } from './middlewares/connector.js';
import { groupRelationMiddleware } from './middlewares/group.js';
import { SurfaceBlockTransformer } from './surface-transformer.js';

const migration = {
  toV4: data => {
    const { elements } = data;
    if (elements instanceof Boxed) {
      const value = elements.getValue();
      if (!value) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const [key, element] of (value as Record<string, any>).entries()) {
        const type = element.get('type') as string;
        if (type === 'shape' || type === 'text') {
          const isBold = element.get('isBold');
          const isItalic = element.get('isItalic');
          element.delete('isBold');
          element.delete('isItalic');
          if (isBold) {
            element.set('bold', true);
          }
          if (isItalic) {
            element.set('italic', true);
          }
        }
        if (type === 'connector') {
          const source = element.get('source');
          const target = element.get('target');
          const sourceId = source['id'];
          const targetId = target['id'];
          if (!source['position'] && !sourceId) {
            value.delete(key);
            return;
          }
          if (!target['position'] && !targetId) {
            value.delete(key);
            return;
          }
        }
      }
    } else {
      for (const key of Object.keys(elements)) {
        const element = elements[key] as Record<string, unknown>;
        const type = element['type'] as string;
        if (type === 'shape' || type === 'text') {
          const isBold = element['isBold'];
          const isItalic = element['isItalic'];
          delete element['isBold'];
          delete element['isItalic'];
          if (isBold) {
            element['bold'] = true;
          }
          if (isItalic) {
            element['italic'] = true;
          }
        }
        if (type === 'connector') {
          const source = element['source'] as Record<string, unknown>;
          const target = element['target'] as Record<string, unknown>;
          const sourceId = source['id'];
          const targetId = target['id'];
          // @ts-expect-error
          if (!source['position'] && (!sourceId || !elements[sourceId])) {
            delete elements[key];
            return;
          }
          // @ts-expect-error
          if (!target['position'] && (!targetId || !elements[targetId])) {
            delete elements[key];
            return;
          }
        }
      }
    }
  },
  toV5: data => {
    const { elements } = data;
    if (!((elements as object | Boxed) instanceof Boxed)) {
      const yMap = new DocCollection.Y.Map() as Y.Map<Y.Map<unknown>>;

      Object.entries(elements).forEach(([key, value]) => {
        const map = new DocCollection.Y.Map();
        Object.entries(value).forEach(([_key, _value]) => {
          map.set(
            _key,
            _value instanceof DocCollection.Y.Text
              ? _value.clone()
              : _value instanceof Text
                ? _value.yText.clone()
                : _value
          );
        });
        yMap.set(key, map);
      });
      const wrapper = new Boxed(yMap);
      data.elements = wrapper;
    }

    const childrenMap = data.elements.getValue() as Y.Map<Y.Map<unknown>>;

    for (const [id, element] of childrenMap) {
      if (
        element.get('type') === 'mindmap' ||
        element.get('type') === 'group'
      ) {
        const children = element.get('children') as Y.Map<Y.Map<unknown>>;

        if (children?.size === 0) {
          childrenMap.delete(id);
        }
      }
    }
  },
} satisfies Record<string, MigrationRunner<typeof SurfaceBlockSchema>>;

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  props: (internalPrimitives): SurfaceBlockProps => ({
    elements: internalPrimitives.Boxed(new DocCollection.Y.Map()),
  }),
  metadata: {
    version: 5,
    role: 'hub',
    parent: ['affine:page'],
    children: [
      'affine:frame',
      'affine:image',
      'affine:bookmark',
      'affine:attachment',
      'affine:embed-*',
      'affine:edgeless-text',
    ],
  },
  onUpgrade: (data, previousVersion, version) => {
    if (previousVersion < 4 && version >= 4) {
      migration.toV4(data);
    }
    if (previousVersion < 5 && version >= 5) {
      migration.toV5(data);
    }
  },
  transformer: () => new SurfaceBlockTransformer(),
  toModel: () => new SurfaceBlockModel(),
});

export type SurfaceMiddleware = (
  surface: SurfaceBlockModel,
  hooks: SurfaceBlockModel['hooks']
) => () => void;

export class SurfaceBlockModel extends BaseSurfaceModel {
  private _disposables: DisposableGroup = new DisposableGroup();

  override _init() {
    this._extendElement(elementsCtorMap);
    super._init();
  }

  override applyMiddlewares() {
    [
      connectorMiddleware(this, this.hooks),
      groupRelationMiddleware(this, this.hooks),
    ].forEach(disposable => this._disposables.add(disposable));
  }

  getConnectors(id: string) {
    const connectors = this.getElementsByType(
      'connector'
    ) as unknown[] as ConnectorElementModel[];

    return connectors.filter(
      connector => connector.source?.id === id || connector.target?.id === id
    );
  }

  override getElementsByType<K extends keyof BlockSuite.SurfaceElementModelMap>(
    type: K
  ): BlockSuite.SurfaceElementModelMap[K][] {
    return super.getElementsByType(
      type
    ) as BlockSuite.SurfaceElementModelMap[K][];
  }
}
