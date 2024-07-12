export type ReorderingType = 'back' | 'backward' | 'forward' | 'front';

export interface ReorderingAction<T> {
  elements: T[];
  type: ReorderingType;
}
