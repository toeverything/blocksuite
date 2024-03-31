import { getInsertBelowHandler } from './insert-below';
import type { AIPanelResponseGenerator } from './types';

export const AIResponseGenerators: AIPanelResponseGenerator[] = [
  getInsertBelowHandler,
];
