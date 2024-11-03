import type { EditorHost } from '@blocksuite/block-std';

import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import {
  type EdgelessRootBlockComponent,
  type MindmapElementModel,
  type MindmapSurfaceBlock,
  MiniMindmapPreview,
} from '@blocksuite/blocks';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { getDocRootBlock } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('mind map', () => {
  let edgeless!: EdgelessRootBlockComponent;

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');

    edgeless = getDocRootBlock(doc, editor, 'edgeless');

    edgeless.gfx.tool.setTool('default');

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

    const createPreview = (
      host: EditorHost,
      answer: string = mindmapAnswer
    ) => {
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

  test('new mind map should layout automatically', async () => {
    const gfx = editor.std.get(GfxControllerIdentifier);
    const mindmapId = gfx.surface!.addElement({
      type: 'mindmap',
      children: {
        text: 'Main node',
        children: [
          {
            text: 'Child node',
          },
          {
            text: 'Second child node',
          },
          {
            text: 'Third child node',
          },
        ],
      },
    });
    const mindmap = gfx.getElementById(mindmapId) as MindmapElementModel;
    await wait(0);
    const [child1, child2, child3] = mindmap.tree.children;

    expect(mindmapId).not.toBeUndefined();
    expect(mindmap.tree.children.length).toBe(3);
    expect(mindmap.tree.element.x).toBeLessThan(child1.element.x);
    expect(child1.element.x).toBe(child2.element.x);
    expect(child2.element.x).toBe(child3.element.x);
    expect(child1.element.y).toBeLessThan(child2.element.y);
    expect(child2.element.y).toBeLessThan(child3.element.y);
  });
});
