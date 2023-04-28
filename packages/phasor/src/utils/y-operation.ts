import type * as Y from 'yjs';

export function updateYElementProps(
  yElement: Y.Map<unknown>,
  properties: Record<string, unknown>
) {
  for (const [key, value] of Object.entries(properties)) {
    yElement.set(key, value);
  }
}
