import type { EditorHost } from '@blocksuite/block-std';

export function isInsidePageEditor(host: EditorHost) {
  return Array.from(host.children).some(
    v => v.tagName.toLowerCase() === 'affine-page-root'
  );
}

export function isInsideEdgelessEditor(host: EditorHost) {
  return Array.from(host.children).some(
    v => v.tagName.toLowerCase() === 'affine-edgeless-root'
  );
}
