import type { EdgelessRootBlockComponent } from '@blocksuite/blocks';
import { DocCollection } from '@blocksuite/store';
import { beforeEach, describe, expect, test } from 'vitest';

import { addNote, getDocRootBlock } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('group', () => {
  let service!: EdgelessRootBlockComponent['service'];

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');
    service = getDocRootBlock(window.doc, window.editor, 'edgeless').service;

    return cleanup;
  });

  test('group with no children will be removed automatically', () => {
    const map = new DocCollection.Y.Map<boolean>();
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
    doc.captureSync();
    service.removeElement(ids[1]);
    expect(service.elements.length).toBe(0);

    doc.undo();
    expect(service.elements.length).toBe(2);
    doc.redo();
    expect(service.elements.length).toBe(0);
  });

  test('remove group should remove its children at the same time', () => {
    const map = new DocCollection.Y.Map<boolean>();
    const doc = service.doc;
    const noteId = addNote(doc);
    const shapeId = service.addElement('shape', {
      shapeType: 'rect',
    });

    map.set(noteId, true);
    map.set(shapeId, true);
    const groupId = service.addElement('group', { children: map });

    expect(service.elements.length).toBe(2);
    expect(doc.getBlock(noteId)).toBeDefined();
    doc.captureSync();

    service.removeElement(groupId);
    expect(service.elements.length).toBe(0);
    expect(doc.getBlock(noteId)).toBeUndefined();

    doc.undo();
    expect(doc.getBlock(noteId)).toBeDefined();
    expect(service.elements.length).toBe(2);
  });
});
