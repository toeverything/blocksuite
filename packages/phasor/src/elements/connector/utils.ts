import type { SerializedConnectorProps } from './types.js';

export function validateConnectorProps(
  props: Record<string, unknown>
): props is SerializedConnectorProps {
  return true;
}
