export type ReorderingType = 'front' | 'forward' | 'backward' | 'back';

export interface ReorderingAction<T> {
  type: ReorderingType;
  elements: T[];
}
