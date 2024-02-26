import type { Boxed, Y } from '@blocksuite/store';
import {
  BlockModel,
  defineBlockSchema,
  Slot,
  Workspace,
} from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import type { SerializedXYWH } from '../surface-block/index.js';
import type {
  AnnotationYMap,
  ClipAnnotation,
  TextAnnotation,
  ToPlain,
} from './type.js';
import { AnnotationType } from './type.js';
import { generateAnnotationKey } from './utils/model.js';

export { AnnotationType };

type PDFProps = {
  sourceId: string;
  annotations: Boxed<Y.Map<AnnotationYMap>>;
  xywh: SerializedXYWH;
  index: string;
};

export const PDFBlockSchema = defineBlockSchema({
  flavour: 'affine:pdf',
  props: (internalPrimitives): PDFProps => ({
    annotations: internalPrimitives.Boxed(
      new Workspace.Y.Map<AnnotationYMap>()
    ),
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

export class PDFBlockModel extends selectable<PDFProps>(BlockModel) {
  annotationUpdated = new Slot();

  constructor() {
    super();

    this.created.once(() => {
      this.annotations.getValue()?.observe(event => {
        if (event.changes) {
          this.annotationUpdated.emit();
        }
      });
    });
  }

  addAnnotation(annotation: ToPlain<ClipAnnotation> | ToPlain<TextAnnotation>) {
    const key = generateAnnotationKey();
    const yMap = new Workspace.Y.Map();

    Object.entries(annotation).forEach(([key, value]) => {
      yMap.set(key, value);
    });

    this.annotations.getValue()?.set(key, yMap as AnnotationYMap);

    return key;
  }

  removeAnnotation(key: string) {
    this.annotations.getValue()?.delete(key);
  }

  getAnnotation(key: string) {
    return this.annotations.getValue()?.get(key);
  }

  getAnnotationsByPage(page: number) {
    const annotations = this.annotations.getValue();
    const candidates: { key: string; annotation: AnnotationYMap }[] = [];

    annotations?.forEach((annotation, key) => {
      const rectRecords = annotation.get('highlightRects');

      if (rectRecords?.[page]) {
        candidates.push({
          key,
          annotation,
        });
      }
    });

    return candidates;
  }

  override dispose(): void {
    this.annotationUpdated.dispose();
  }
}
