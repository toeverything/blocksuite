import type { DragDirection } from '../../page-block';

export function showShapeEdgelessToolbar({
  anchorEl,
  direction = 'right-bottom',
  container = document.body,
  abortController = new AbortController(),
}: {
  anchorEl: {
    getBoundingClientRect: () => DOMRect;
    // contextElement?: Element;
  };
  direction?: DragDirection;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  // TODO
  return null;
}
