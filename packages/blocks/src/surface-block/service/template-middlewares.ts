import { assertType } from '@blocksuite/global/utils';
import { type SnapshotReturn } from '@blocksuite/store';

import { generateElementId } from '../index.js';
import type { SlotBlockPayload, TemplateJob } from './template.js';

export const replaceIdMiddleware = (job: TemplateJob) => {
  const regeneratedIdMap = new Map<string, string>();

  job.slots.beforeInsert.on(payload => {
    switch (payload.type) {
      case 'block':
        regenerateBlockId(payload.data);
        break;
    }
  });

  const regenerateBlockId = (data: SlotBlockPayload['data']) => {
    const { blockJson } = data;
    const newId = regeneratedIdMap.has(blockJson.id)
      ? regeneratedIdMap.get(blockJson.id)!
      : job.model.page.workspace.idGenerator('block');

    if (!regeneratedIdMap.has(blockJson.id)) {
      regeneratedIdMap.set(blockJson.id, newId);
    }

    blockJson.id = newId;

    data.parent = data.parent
      ? regeneratedIdMap.get(data.parent) ?? data.parent
      : undefined;

    if (blockJson.flavour === 'affine:surface-ref') {
      assertType<
        SnapshotReturn<{
          reference: string;
        }>
      >(blockJson);

      blockJson.props['reference'] =
        regeneratedIdMap.get(blockJson.props['reference']) ?? '';
    }

    if (blockJson.flavour === 'affine:surface') {
      const elements: Record<string, Record<string, unknown>> = {};
      const defered: string[] = [];

      Object.entries(
        blockJson.props.elements as Record<string, Record<string, unknown>>
      ).forEach(([id, val]) => {
        const newId = generateElementId();

        regeneratedIdMap.set(id, newId);
        val.id = newId;
        elements[newId] = val;

        if (['group', 'connector'].includes(val['type'] as string)) {
          defered.push(newId);
        }
      });

      blockJson.children.forEach(block => {
        regeneratedIdMap.set(
          block.id,
          job.model.page.workspace.idGenerator('block')
        );
      });

      defered.forEach(id => {
        const element = elements[id]!;

        switch (element['type'] as string) {
          case 'group':
            {
              const children = element['children'] as {
                json: Record<string, boolean>;
              };
              const newChildrenJson: Record<string, boolean> = {};

              Object.entries(children.json).forEach(([key, val]) => {
                newChildrenJson[regeneratedIdMap.get(key) ?? key] = val;
              });

              children.json = newChildrenJson;
            }

            break;
          case 'connector':
            {
              const target = element['target'] as { id?: string };

              if (target.id) {
                element['target'] = {
                  ...target,
                  id: regeneratedIdMap.get(target.id),
                };
              }

              const source = element['source'] as { id?: string };

              if (source.id) {
                element['source'] = {
                  ...source,
                  id: regeneratedIdMap.get(source.id),
                };
              }
            }
            break;
        }
      });

      blockJson.props.elements = elements;
    }
  };
};
