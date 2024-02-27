import type { RootBlockComponent } from '../types.js';

export function getClosestRootBlockComponent(
  el: HTMLElement
): RootBlockComponent | null {
  return el.closest('affine-edgeless-root, affine-page-root');
}
