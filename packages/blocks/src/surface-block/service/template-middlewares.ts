import { assertType } from '@blocksuite/global/utils';
import type { Boxed } from '@blocksuite/store';
import { type SnapshotReturn, Workspace, type Y } from '@blocksuite/store';

import { generateElementId } from '../index.js';
import type { SlotBlockPayload, TemplateJob } from './template.js';

export const replaceIdMiddleware = (job: TemplateJob) => {
  const regeneratedIdMap = new Map<string, string>();

  job.slots.beforeInsert.on(payload => {
    switch (payload.type) {
      case 'block':
        generateBlock(payload.data);
        break;
    }
  });

  const generateBlock = (data: SlotBlockPayload['data']) => {
    const newId = job.model.page.workspace.idGenerator('block');

    const { modelData } = data;

    regeneratedIdMap.set(modelData.id, newId);

    modelData.id = newId;

    data.parent = data.parent
      ? regeneratedIdMap.get(data.parent) ?? data.parent
      : undefined;

    if (modelData.flavour === 'affine:surface-ref') {
      assertType<
        SnapshotReturn<{
          reference: string;
        }>
      >(modelData);

      modelData.props['reference'] =
        regeneratedIdMap.get(modelData.props['reference']) ?? '';
    }

    if (modelData.flavour === 'affine:surface') {
      assertType<
        SnapshotReturn<{
          elements: Boxed<Y.Map<Y.Map<unknown>>>;
        }>
      >(modelData);

      const elementsMap = new Workspace.Y.Map() as Y.Map<Y.Map<unknown>>;
      const defered: string[] = [];

      modelData.props.elements.getValue()?.forEach((val, id) => {
        const newId = generateElementId();

        regeneratedIdMap.set(id, newId);
        elementsMap.set(newId, val);

        const type = val.get('type') as string;

        if (['group', 'connector'].includes(type)) {
          defered.push(newId);
        }
      });

      defered.forEach(id => {
        const element = elementsMap.get(id)!;

        switch (element.get('type') as string) {
          case 'group':
            {
              const children = element.get('children') as Y.Map<unknown>;
              const newChildren = new Workspace.Y.Map();

              children.forEach((_, childId) => {
                newChildren.set(regeneratedIdMap.get(childId) ?? childId, true);
              });

              element.set('children', newChildren);
            }
            break;
          case 'connector':
            {
              const target = element.get('target') as { id?: string };

              if (target.id) {
                element.set('target', {
                  ...target,
                  id: regeneratedIdMap.get(target.id),
                });
              }

              const source = element.get('source') as { id?: string };

              if (source.id) {
                element.set('source', {
                  ...source,
                  id: regeneratedIdMap.get(source.id),
                });
              }
            }
            break;
        }
      });

      console.log(elementsMap);
      modelData.props.elements.setValue(elementsMap);
      console.log(modelData.props.elements.getValue());
    }
  };
};
