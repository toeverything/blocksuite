import type { EdgelessPageBlockComponent } from '@blocksuite/blocks';
import { Workspace } from '@blocksuite/store';
import { beforeEach, describe, expect, test } from 'vitest';

import { getPageRootBlock } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('group', () => {
  let service!: EdgelessPageBlockComponent['service'];

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');
    service = getPageRootBlock(window.page, window.editor, 'edgeless').service;

    return cleanup;
  });

  test('remove group without children', () => {
    const map = new Workspace.Y.Map<boolean>();
    const ids = Array.from({ length: 2 }).map(() => {
      const id = service.addElement('shape', {
        shapeType: 'rect',
      });
      map.set(id, true);

      return id;
    });
    service.addElement('group', { children: map });
    expect(service.elements.length).toBe(3);
    service.removeElement(ids[0]);
    expect(service.elements.length).toBe(2);
    page.captureSync();
    service.removeElement(ids[1]);
    expect(service.elements.length).toBe(0);

    page.undo();
    expect(service.elements.length).toBe(2);
    page.redo();
    expect(service.elements.length).toBe(0);
  });
});
