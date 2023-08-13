import type { PageBlockComponent } from '../types.js';

export function getClosestPageBlockComponent(
  el: HTMLElement
): PageBlockComponent | null {
  return el.closest('affine-edgeless-page, affine-page-block');
}
