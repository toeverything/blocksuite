import type { ConnectorElementModel } from '@blocksuite/affine-model';
import type { BlockSnapshot, SnapshotReturn } from '@blocksuite/store';

import { CommonUtils, sortIndex } from '@blocksuite/affine-block-surface';
import { assertExists, assertType, Bound } from '@blocksuite/global/utils';

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
      : job.model.doc.collection.idGenerator();

    if (!regeneratedIdMap.has(blockJson.id)) {
      regeneratedIdMap.set(blockJson.id, newId);
    }

    blockJson.id = newId;

    data.parent = data.parent
      ? (regeneratedIdMap.get(data.parent) ?? data.parent)
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
        const newId = CommonUtils.generateElementId();

        regeneratedIdMap.set(id, newId);
        val.id = newId;
        elements[newId] = val;

        if (['connector', 'group'].includes(val['type'] as string)) {
          defered.push(newId);
        }
      });

      blockJson.children.forEach(block => {
        regeneratedIdMap.set(block.id, job.model.doc.collection.idGenerator());
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

export const createInsertPlaceMiddleware = (targetPlace: Bound) => {
  return (job: TemplateJob) => {
    if (job.type !== 'template') return;

    let templateBound: Bound | null = null;
    let offset: {
      x: number;
      y: number;
    };

    job.slots.beforeInsert.on(blockData => {
      if (blockData.type === 'template') {
        templateBound = blockData.bound;

        if (templateBound) {
          offset = {
            x: targetPlace.x - templateBound.x,
            y: targetPlace.y - templateBound.y,
          };

          templateBound.x = targetPlace.x;
          templateBound.y = targetPlace.y;
        }
      } else {
        if (templateBound && offset) changePosition(blockData.data.blockJson);
      }
    });

    const ignoreType = ['group', 'connector'];
    const changePosition = (blockJson: BlockSnapshot) => {
      assertExists(templateBound);

      if (blockJson.props.xywh) {
        const bound = Bound.deserialize(blockJson.props['xywh'] as string);

        blockJson.props['xywh'] = new Bound(
          bound.x + offset.x,
          bound.y + offset.y,
          bound.w,
          bound.h
        ).serialize();
      }

      if (blockJson.flavour === 'affine:surface') {
        Object.entries(
          blockJson.props.elements as Record<string, Record<string, unknown>>
        ).forEach(([_, val]) => {
          const type = val['type'] as string;

          if (ignoreType.includes(type) && val['xywh']) {
            delete val['xywh'];
          }

          if (val['xywh']) {
            const bound = Bound.deserialize(val['xywh'] as string);

            val['xywh'] = new Bound(
              bound.x + offset.x,
              bound.y + offset.y,
              bound.w,
              bound.h
            ).serialize();
          }

          if (type === 'connector') {
            (['target', 'source'] as const).forEach(prop => {
              const propVal = val[prop];
              assertType<ConnectorElementModel['target']>(propVal);

              if (propVal['id'] || !propVal['position']) return;
              const pos = propVal['position'];

              propVal['position'] = [pos[0] + offset.x, pos[1] + offset.y];
            });
          }
        });
      }
    };
  };
};

export const createStickerMiddleware = (
  center: {
    x: number;
    y: number;
  },
  getIndex: () => string
) => {
  return (job: TemplateJob) => {
    job.slots.beforeInsert.on(blockData => {
      if (blockData.type === 'block') {
        changeInserPosition(blockData.data.blockJson);
      }
    });

    const changeInserPosition = (blockJson: BlockSnapshot) => {
      if (blockJson.flavour === 'affine:image' && blockJson.props.xywh) {
        const bound = Bound.deserialize(blockJson.props['xywh'] as string);

        blockJson.props['xywh'] = new Bound(
          center.x - bound.w / 2,
          center.y - bound.h / 2,
          bound.w,
          bound.h
        ).serialize();

        blockJson.props.index = getIndex();
      }
    };
  };
};

export const createRegenerateIndexMiddleware = (
  generateIndex: () => string
) => {
  return (job: TemplateJob) => {
    job.slots.beforeInsert.on(blockData => {
      if (blockData.type === 'template') {
        generateIndexMap();
      }

      if (blockData.type === 'block') {
        resetIndex(blockData.data.blockJson);
      }
    });

    const indexMap = new Map<string, string>();

    const generateIndexMap = () => {
      const indexList: {
        id: string;
        index: string;
        flavour: string;
        element?: boolean;
      }[] = [];
      const frameList: {
        id: string;
        index: string;
      }[] = [];
      const groupIndexMap = new Map<
        string,
        {
          index: string;
          id: string;
        }
      >();

      job.walk(block => {
        if (block.props.index) {
          if (block.flavour === 'affine:frame') {
            frameList.push({
              id: block.id,
              index: block.props.index as string,
            });
          } else {
            indexList.push({
              id: block.id,
              index: block.props.index as string,
              flavour: block.flavour,
            });
          }
        }

        if (block.flavour === 'affine:surface') {
          Object.entries(
            block.props.elements as Record<string, Record<string, unknown>>
          ).forEach(([_, element]) => {
            indexList.push({
              index: element['index'] as string,
              flavour: element['type'] as string,
              id: element['id'] as string,
              element: true,
            });

            if (element['type'] === 'group') {
              const children = element['children'] as {
                json: Record<string, boolean>;
              };
              const groupIndex = {
                index: element['index'] as string,
                id: element['id'] as string,
              };

              Object.keys(children.json).forEach(key => {
                groupIndexMap.set(key, groupIndex);
              });
            }
          });
        }
      });

      indexList.sort((a, b) => sortIndex(a, b, groupIndexMap));
      frameList.sort((a, b) => sortIndex(a, b, groupIndexMap));

      frameList.forEach(index => {
        indexMap.set(index.id, generateIndex());
      });

      indexList.forEach(index => {
        indexMap.set(index.id, generateIndex());
      });
    };
    const resetIndex = (blockJson: BlockSnapshot) => {
      if (blockJson.props.index) {
        blockJson.props.index =
          indexMap.get(blockJson.id) ?? blockJson.props.index;
      }

      if (blockJson.flavour === 'affine:surface') {
        Object.entries(
          blockJson.props.elements as Record<string, Record<string, unknown>>
        ).forEach(([_, element]) => {
          if (element['index']) {
            element['index'] = indexMap.get(element['id'] as string);
          }
        });
      }
    };
  };
};
