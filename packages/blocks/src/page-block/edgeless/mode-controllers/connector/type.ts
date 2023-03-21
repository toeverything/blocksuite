import type { Direction } from './constants.js';

export interface PathFindingPointData {
  direction: Direction;
  origin: number[];
  endpoint: number[];
}
