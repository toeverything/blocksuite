import { assertExists, type Page, type Workspace } from '@blocksuite/store';
import * as Y from 'yjs';

export interface InitFn {
  (workspace: Workspace, pageId: string): void;
  id: string;
  displayName: string;
  description: string;
}

export function addShapeElement(
  page: Page,
  surfaceBlockId: string,
  shape: Record<string, unknown>
) {
  const shapeYElement = new Y.Map();
  for (const [key, value] of Object.entries(shape)) {
    shapeYElement.set(key, value);
  }
  const yBlock = page.getYBlockById(surfaceBlockId);
  assertExists(yBlock);
  let yContainer = yBlock.get('elements') as InstanceType<typeof page.YMap>;
  if (!yContainer) {
    yContainer = new page.YMap();
    yBlock.set('elements', yContainer);
  }
  yContainer.set(shape.id as string, shapeYElement);
}
