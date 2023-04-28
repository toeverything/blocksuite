import type { SerializedBrushProps } from './types.js';

export function validateBrushProps(
  props: Record<string, unknown>
): props is SerializedBrushProps {
  return true;
}
