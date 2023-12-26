import { assertExists } from '@blocksuite/global/utils';
import type { JobMiddleware } from '@blocksuite/store';

import type { DatabaseBlockModel } from '../../database-block/index.js';

export const replaceIdMiddleware: JobMiddleware = ({ slots, workspace }) => {
  const idMap = new Map<string, string>();
  slots.afterImport.on(payload => {
    if (
      payload.type === 'block' &&
      payload.snapshot.flavour === 'affine:database'
    ) {
      const model = payload.model as DatabaseBlockModel;
      Object.keys(model.cells).forEach(cellId => {
        if (idMap.has(cellId)) {
          model.cells[idMap.get(cellId)!] = model.cells[cellId];
          delete model.cells[cellId];
        }
      });
    }
  });
  slots.beforeImport.on(payload => {
    if (payload.type === 'page') {
      payload.snapshot.meta.id = workspace.idGenerator('page');
      return;
    }

    if (payload.type === 'block') {
      const { snapshot } = payload;
      if (snapshot.flavour === 'affine:page') {
        const index = snapshot.children.findIndex(
          c => c.flavour === 'affine:surface'
        );
        if (index !== -1) {
          const [surface] = snapshot.children.splice(index, 1);
          snapshot.children.push(surface);
        }
      }

      const original = snapshot.id;
      let newId: string;
      if (idMap.has(original)) {
        newId = idMap.get(original)!;
      } else {
        newId = workspace.idGenerator('block');
        idMap.set(original, newId);
      }
      snapshot.id = newId;

      if (snapshot.flavour === 'affine:surface') {
        // Generate new IDs for images and frames in advance.
        snapshot.children.forEach(child => {
          const original = child.id;
          if (idMap.has(original)) {
            newId = idMap.get(original)!;
          } else {
            newId = workspace.idGenerator('block');
            idMap.set(original, newId);
          }
        });

        Object.entries(
          snapshot.props.elements as Record<string, Record<string, unknown>>
        ).forEach(([_, value]) => {
          switch (value.type) {
            case 'connector': {
              // @ts-ignore
              let connection = value.source as Record<string, string>;
              if (idMap.has(connection.id)) {
                const newId = idMap.get(connection.id);
                assertExists(newId, 'reference id must exist');
                connection.id = newId;
              }
              connection = value.target as Record<string, string>;
              if (idMap.has(connection.id)) {
                const newId = idMap.get(connection.id);
                assertExists(newId, 'reference id must exist');
                connection.id = newId;
              }
              break;
            }
            case 'group': {
              // @ts-ignore
              const json = value.children.json as Record<string, unknown>;
              Object.entries(json).forEach(([key, value]) => {
                if (idMap.has(key)) {
                  delete json[key];
                  const newKey = idMap.get(key);
                  assertExists(newKey, 'reference id must exist');
                  json[newKey] = value;
                }
              });
              break;
            }
            default:
              break;
          }
        });
      }
    }
  });
};

export const customImageProxyMiddleware = (
  imageProxyURL: string
): JobMiddleware => {
  return ({ adapterConfigs }) => {
    adapterConfigs.set('imageProxy', imageProxyURL);
  };
};

export const defaultImageProxyMiddleware = customImageProxyMiddleware(
  'https://workers.toeverything.workers.dev/proxy/image'
);
