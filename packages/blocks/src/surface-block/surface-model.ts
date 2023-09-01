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
  elements: NativeWrapper<Y.Map<Y.Map<unknown>>>;
};

const migration = {
  toV5: data => {
    const { elements } = data;
    if (isPureObject(elements)) {
      const map: Record<string, Y.Map<unknown>> = {};
      const yMap = native2Y(map, false);
      const wrapper = new NativeWrapper(yMap);
      data.elements = wrapper;
      const target = wrapper.getValue();
      for (const [key, value] of Object.entries(elements)) {
        target?.set(key, native2Y(value, false));
      }
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
        const sourceId = source.get('id');
        const targetId = target.get('id');
        if (!source.get('position') && (!sourceId || !value.get(sourceId))) {
          value.delete(key);
          return;
        }
        if (!target.get('position') && !targetId && !value.get(targetId)) {
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
