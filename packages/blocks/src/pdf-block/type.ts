import type { Y } from '@blocksuite/store';

import type { YDict } from './utils/y-utils.js';

export enum AnnotationType {
  Text = 0,
  Clip = 1,
}

export interface BaseAnnotation<T extends AnnotationType> {
  type: T;
  comment: Y.Text;
  highlightRects: Record<number, [number, number, number, number][]>;
}

export type Annotation = BaseAnnotation<AnnotationType>;

export type ClipAnnotation = BaseAnnotation<AnnotationType.Clip>;

export type TextAnnotation = BaseAnnotation<AnnotationType.Text> & {
  highlightText: string;
};

export type ToPlain<T> = {
  [K in keyof T]: T[K] extends Y.Text ? string : T[K];
};

export type AnnotationYMap = YDict<BaseAnnotation<AnnotationType>>;
