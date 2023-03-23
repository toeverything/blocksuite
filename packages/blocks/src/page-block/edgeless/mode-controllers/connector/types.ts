import type { Direction } from './constants.js';

export interface RouteEndpoint {
  box: number[][];
  origin: number[];
  direction: Direction;
}

export interface PathFindingPointData {
  direction: Direction;
  origin: number[];
  endpoint: number[];
}
