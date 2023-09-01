import type { MigrationRunner, Y } from '@blocksuite/store';
import {
  defineBlockSchema,
  isPureObject,
  native2Y,
  NativeWrapper,
  type SchemaToModel,
  Workspace,
} from '@blocksuite/store';

type SurfaceBlockProps = {
  elements: NativeWrapper<Y.Map<unknown>>;
};

const migration = {
  toV5: data => {
    const { elements } = data;
    if (isPureObject(elements)) {
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
      const wrapper = new NativeWrapper<Y.Map<unknown>>(yMap);
      data.elements = wrapper;
    }
  },
  toV4: data => {
    const { elements } = data;
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
        if (!target['position'] && !targetId && !value.get(targetId)) {
          value.delete(key);
          return;
        }
      }
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
    children: [],
  },
  onUpgrade: (data, previousVersion, version) => {
    if (previousVersion < 5 && version >= 5) {
      migration.toV5(data);
    }
    if (previousVersion < 4 && version >= 4) {
      migration.toV4(data);
    }
  },
});

export type SurfaceBlockModel = SchemaToModel<typeof SurfaceBlockSchema>;
