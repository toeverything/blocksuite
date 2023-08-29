import type { Connection } from '@blocksuite/phasor';
import type { MigrationRunner } from '@blocksuite/store';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

type SurfaceBlockProps = {
  elements: Record<string, unknown>;
};

const migration = {
  toV4: data => {
    const { elements } = data;
    Object.keys(elements).forEach(key => {
      const element = elements[key] as Record<string, unknown>;
      const type = element.type;
      if (type === 'shape' || type === 'text') {
        const isBold = element.isBold;
        const isItalic = element.isItalic;
        delete element.isBold;
        delete element.isItalic;
        if (isBold) {
          element.bold = true;
        }
        if (isItalic) {
          element.italic = true;
        }
      } else if (type === 'connector') {
        const source = element.source as Connection;
        const target = element.target as Connection;
        if (!source.position && (!source.id || !elements[source.id])) {
          delete elements[key];
          return;
        }
        if (!target.id && (!target.id || !elements[target.id])) {
          delete elements[key];
          return;
        }
      }
    });
  },
} satisfies Record<string, MigrationRunner<typeof SurfaceBlockSchema>>;

export const SurfaceBlockSchema = defineBlockSchema({
  flavour: 'affine:surface',
  props: (): SurfaceBlockProps => ({
    elements: {},
  }),
  metadata: {
    version: 4,
    role: 'hub',
    parent: ['affine:page'],
    children: [],
  },
  onUpgrade: (data, previousVersion, version) => {
    if (previousVersion < 4 && version >= 4) {
      migration.toV4(data);
    }
  },
});

export type SurfaceBlockModel = SchemaToModel<typeof SurfaceBlockSchema>;
