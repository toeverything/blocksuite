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

  const CATEGORIES = ['Wardley', 'EDGY', 'Cynefin', 'Estuarine', 'BPMN', 'Other'];

  test('the catalog exposes every framework + Other category, not cat stickers', async () => {
    const cats = await EdgelessTemplatePanel.templates.categories();
    expect(cats).toEqual(expect.arrayContaining(CATEGORIES));
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

  test('every template in every category inserts valid elements', async () => {
    const surface = getSurface(window.doc, window.editor).model;
    for (const cat of CATEGORIES) {
      const list = await EdgelessTemplatePanel.templates.list(cat);
      expect(list.length).toBeGreaterThan(0);
      for (const template of list) {
        const before = surface.elementModels.length;
        const job = createTemplateJob(std, template.type);
        const bound = await job.insertTemplate(template.content);
        expect(bound, `${cat} / ${template.name}`).not.toBeNull();
        expect(
          surface.elementModels.length,
          `${cat} / ${template.name}`
        ).toBeGreaterThan(before);
      }
    }
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
