import type { Boxed, Y } from '@blocksuite/store';
import { BlockModel, defineBlockSchema, Workspace } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import type { SerializedXYWH } from '../surface-block/index.js';

enum AnnotationType {
  Text = 0,
  Clip = 1,
}

type TextAnnotation = {
  type: AnnotationType.Text;
  content: string;
  /**
   * hightlighted rects in each page
   *
   * Map<page, [x, y, w, h]>
   */
  highlightRects: Y.Map<[number, number, number, number]>;
};

type ClipAnnotation = {
  type: AnnotationType.Clip;
  highlightRect: [number, number, number, number];
};

type Annotation = TextAnnotation | ClipAnnotation;

type PDFProps = {
  sourceId: string;
  annotations: Boxed<Y.Map<Annotation>>;
  xywh: SerializedXYWH;
  index: string;
};

export const PDFBlockSchema = defineBlockSchema({
  flavour: 'affine:pdf',
  props: (internalPrimitives): PDFProps => ({
    annotations: internalPrimitives.Boxed(new Workspace.Y.Map()),
    sourceId: '',
    xywh: `[0,0,100,100]`,
    index: 'a0',
  }),
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['affine:surface', 'affine:note'],
  },
  toModel() {
    return new PDFBlockModel();
  },
});

export class PDFBlockModel extends selectable<PDFProps>(BlockModel) {}
