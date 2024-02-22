import type { Boxed, Y } from '@blocksuite/store';
import { BlockModel, defineBlockSchema, Workspace } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import type { SerializedXYWH } from '../surface-block/index.js';
import type { YDict } from './utils/y-utils.js';

enum AnnotationType {
  Text = 0,
  Clip = 1,
}

type TextAnnotation = YDict<{
  key: string;
  type: AnnotationType.Text;
  comment: Y.Text;

  /**
   * The selected text
   */
  text: string;

  /**
   * hightlighted rects in each page
   *
   * Rect<page, [x, y, w, h]>
   */
  highlightRects: Record<number, [number, number, number, number]>;
}>;

type ClipAnnotation = YDict<{
  key: string;
  type: AnnotationType.Clip;
  comment: Y.Text;

  highlightRect: [number, number, number, number];
}>;

type Annotation = TextAnnotation | ClipAnnotation;

type PDFProps = {
  sourceId: string;
  annotations: Boxed<Y.Array<Annotation>>;
  xywh: SerializedXYWH;
  index: string;
};

export const PDFBlockSchema = defineBlockSchema({
  flavour: 'affine:pdf',
  props: (internalPrimitives): PDFProps => ({
    annotations: internalPrimitives.Boxed(new Workspace.Y.Array()),
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
