import type { Page } from '@blocksuite/store';
import * as Y from 'yjs';

export function addShapeElement(page: Page, shape: Record<string, unknown>) {
  const shapeYElement = new Y.Map();
  for (const [key, value] of Object.entries(shape)) {
    shapeYElement.set(key, value);
  }
  page.ySurfaceContainer.set(shape.id as string, shapeYElement);
}
