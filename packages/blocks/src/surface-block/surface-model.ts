import type { MigrationRunner, Y } from '@blocksuite/store';
import {
  defineBlockSchema,
  NativeWrapper,
  type SchemaToModel,
  Workspace,
} from '@blocksuite/store';

import { CanvasTextFontStyle, CanvasTextFontWeight } from './consts.js';
import { SurfaceBlockTransformer } from './surface-transformer.js';

export type SurfaceBlockProps = {
  elements: NativeWrapper<Y.Map<unknown>>;
};

const migration = {
  toV4: data => {
    const { elements } = data;
    if ((elements as object | NativeWrapper) instanceof NativeWrapper) {
      const value = elements.getValue();
      if (!value) {
        return;
      }
      for (const [key, element] of value.entries()) {
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
          if (!source['position'] && (!sourceId || !value.get(sourceId))) {
            value.delete(key);
            return;
          }
          if (!target['position'] && (!targetId || !value.get(targetId))) {
            value.delete(key);
            return;
          }
        }
      }
    } else {
      for (const key of Object.keys(elements)) {
        // @ts-expect-error
        const element = elements[key];
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
          const source = element['source'];
          const target = element['target'];
          const sourceId = source['id'];
          const targetId = target['id'];
          // @ts-expect-error
          if (!source['position'] && (!sourceId || !elements[sourceId])) {
            // @ts-expect-error
            delete elements[key];
            return;
          }
          // @ts-expect-error
          if (!target['position'] && (!targetId || !elements[targetId])) {
            // @ts-expect-error
            delete elements[key];
            return;
          }
        }
      }
    }
  },
  toV5: data => {
    const { elements } = data;
    if (!((elements as object | NativeWrapper) instanceof NativeWrapper)) {
      const yMap = new Workspace.Y.Map();

      Object.entries(elements).forEach(([key, value]) => {
        const map = new Workspace.Y.Map();
        Object.entries(value).forEach(([_key, _value]) => {
          map.set(
            _key,
            _value instanceof Workspace.Y.Text ? _value.clone() : _value
          );
        });
        yMap.set(key, map);
      });
      const wrapper = new NativeWrapper(yMap);
      data.elements = wrapper;
    }
  },
} satisfies Record<string, MigrationRunner<typeof SurfaceBlockSchema>>;

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  props: (internalPrimitives): SurfaceBlockProps => ({
    elements: internalPrimitives.Native(new Workspace.Y.Map()),
  }),
  metadata: {
    version: 5,
    role: 'hub',
    parent: ['affine:page'],
    children: ['affine:frame', 'affine:image'],
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
});

export type SurfaceBlockModel = SchemaToModel<typeof SurfaceBlockSchema>;
