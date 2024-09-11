import type { EditorHost } from '@blocksuite/block-std';

import {
  type MindmapSurfaceBlock,
  MiniMindmapPreview,
} from '@blocksuite/blocks';
import { beforeEach, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { setupEditor } from '../utils/setup.js';

beforeEach(async () => {
  const cleanup = await setupEditor('edgeless');

  return cleanup;
});

test('mind map preview', async () => {
  const mindmapAnswer = `
- Mindmap
  - Node 1
    - Node 1.1
    - Node 1.2
  - Node 2
    - Node 2.1
    - Node 2.2
`;

  const createPreview = (host: EditorHost, answer: string = mindmapAnswer) => {
    const mindmapPreview = new MiniMindmapPreview();

    mindmapPreview.answer = answer;
    mindmapPreview.host = host;
    mindmapPreview.ctx = {
      get() {
        return {};
      },
      set() {},
    };

    document.body.append(mindmapPreview);

    return mindmapPreview;
  };

  const miniMindMapPreview = createPreview(window.editor.host!);
  await wait(50);
  const miniMindMapSurface = miniMindMapPreview.renderRoot.querySelector(
    'mini-mindmap-surface-block'
  ) as MindmapSurfaceBlock;

  expect(miniMindMapSurface).not.toBeNull();
  expect(miniMindMapSurface.renderer).toBeDefined();
  expect(miniMindMapSurface.renderer?.canvas.isConnected).toBe(true);
  expect(miniMindMapSurface.renderer?.canvas.width).toBeGreaterThan(0);
  expect(miniMindMapSurface.renderer?.canvas.height).toBeGreaterThan(0);

  expect(miniMindMapSurface.model.elementModels.length).toBe(8);

  return () => {
    miniMindMapPreview.remove();
  };
});
