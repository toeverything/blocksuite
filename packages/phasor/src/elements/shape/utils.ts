import type { SerializedShapeProps } from './types.js';

export function validateShapeProps(
  props: Record<string, unknown>
): props is SerializedShapeProps {
  return true;
}
