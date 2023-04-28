import type { IBound } from '../../consts.js';
import { Bound } from '../../utils/bound.js';
import type { SerializedBrushProps } from './types.js';

export function validateBrushProps(
  props: Record<string, unknown>
): props is SerializedBrushProps {
  return true;
}

export function inflateBound(bound: IBound, delta: number) {
  const half = delta / 2;

  return new Bound(
    bound.x - half,
    bound.y - half,
    bound.w + delta,
    bound.h + delta
  );
}
