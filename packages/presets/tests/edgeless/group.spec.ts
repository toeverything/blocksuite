import {
  CanvasElementType,
  type SurfaceBlockComponent,
} from '@blocksuite/blocks';
import { Workspace } from '@blocksuite/store';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { addElement, getSurface } from '../utils/edgeless.js';
import { cleanup, setupEditor } from '../utils/setup.js';

const { GROUP } = CanvasElementType;

describe('group', () => {
  let surface!: SurfaceBlockComponent;
  beforeEach(async () => {
    await setupEditor('edgeless');
    surface = getSurface(window.page, window.editor);
  });

  afterEach(() => {
    cleanup();
  });

  test('remove group without children', async () => {
    const map = new Workspace.Y.Map<boolean>();
    const ids = Array.from({ length: 2 }).map(() => {
      const id = addElement(
        'shape',
        {
          shapeType: 'rect',
        },
        surface
      );
      map.set(id, true);

      return id;
    });
    surface.addElement(GROUP, { children: map });
    expect(surface.getElements().length).toBe(3);
    surface.removeElement(ids[0]);
    expect(surface.getElements().length).toBe(2);
    page.captureSync();
    surface.removeElement(ids[1]);
    expect(surface.getElements().length).toBe(0);

    page.undo();
    expect(surface.getElements().length).toBe(2);
    page.redo();
    expect(surface.getElements().length).toBe(0);
  });
});
