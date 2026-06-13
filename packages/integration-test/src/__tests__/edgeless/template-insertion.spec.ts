import { createTemplateJob, EdgelessTemplatePanel } from '@labre/affine/gfx/template';
import type { BlockStdScope } from '@labre/std';
import { beforeEach, describe, expect, test } from 'vitest';

import { getDocRootBlock, getSurface } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('Framework template catalog', () => {
  let std!: BlockStdScope;

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');
    std = getDocRootBlock(window.doc, window.editor, 'edgeless').std;
    return cleanup;
  });

  test('the catalog exposes framework + Other categories, not cat stickers', async () => {
    const cats = await EdgelessTemplatePanel.templates.categories();
    expect(cats).toContain('BPMN');
    expect(cats).toContain('Other');
    expect(cats).not.toContain('Paws and pals');

    const other = await EdgelessTemplatePanel.templates.list('Other');
    expect(other.map(t => t.name)).toEqual(
      expect.arrayContaining([
        'SWOT',
        'Kanban board',
        'Business model canvas',
        'Fishbone (Ishikawa)',
        'Gantt chart',
      ])
    );
  });

  test('the BPMN category is registered with its templates', async () => {
    const cats = await EdgelessTemplatePanel.templates.categories();
    expect(cats).toContain('BPMN');

    const bpmn = await EdgelessTemplatePanel.templates.list('BPMN');
    const names = bpmn.map(t => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'Simple process',
        'Start event',
        'End event',
        'Task',
        'Exclusive gateway',
        'Sequence flow',
        'Pool',
      ])
    );
  });

  test('every BPMN and Other template inserts valid elements onto the surface', async () => {
    const surface = getSurface(window.doc, window.editor).model;
    const all = [
      ...(await EdgelessTemplatePanel.templates.list('BPMN')),
      ...(await EdgelessTemplatePanel.templates.list('Other')),
    ];

    for (const template of all) {
      const before = surface.elementModels.length;
      const job = createTemplateJob(std, template.type);
      const bound = await job.insertTemplate(template.content);
      expect(bound).not.toBeNull();
      expect(surface.elementModels.length).toBeGreaterThan(before);
    }
  });

  test('the simple-process template inserts a pool, nodes and connectors', async () => {
    const surface = getSurface(window.doc, window.editor).model;
    const tpl = (await EdgelessTemplatePanel.templates.list('BPMN')).find(
      t => t.name === 'Simple process'
    )!;

    const job = createTemplateJob(std, tpl.type);
    await job.insertTemplate(tpl.content);

    const counts: Record<string, number> = {};
    for (const el of surface.elementModels)
      counts[el.type] = (counts[el.type] ?? 0) + 1;

    expect(counts.bpmnPool).toBe(1);
    expect(counts.bpmnNode).toBe(6); // start, 3 tasks, gateway, end
    expect(counts.connector).toBe(6);
  });
});
