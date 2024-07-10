import { assertExists } from '@blocksuite/global/utils';
import type { DeltaOperation, JobMiddleware } from '@blocksuite/store';

import type { DatabaseBlockModel } from '../../database-block/index.js';
import type { ListBlockModel } from '../../list-block/index.js';
import type { ParagraphBlockModel } from '../../paragraph-block/index.js';
import type { SurfaceRefBlockModel } from '../../surface-ref-block/surface-ref-model.js';
import { DEFAULT_IMAGE_PROXY_ENDPOINT } from '../consts.js';

export const replaceIdMiddleware: JobMiddleware = ({ slots, collection }) => {
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

    // replace LinkedPage pageId with new id in paragraph blocks
    if (
      payload.type === 'block' &&
      ['affine:paragraph', 'affine:list'].includes(payload.snapshot.flavour)
    ) {
      const model = payload.model as ParagraphBlockModel | ListBlockModel;
      let prev = 0;
      const delta: DeltaOperation[] = [];
      for (const d of model.text.toDelta()) {
        if (d.attributes?.reference?.pageId) {
          const newId = idMap.get(d.attributes.reference.pageId);
          if (!newId) {
            prev += d.insert?.length ?? 0;
            continue;
          }

          if (prev > 0) {
            delta.push({ retain: prev });
          }

          delta.push({
            retain: d.insert?.length ?? 0,
            attributes: {
              reference: {
                ...d.attributes.reference,
                pageId: newId,
              },
            },
          });
          prev = 0;
        } else {
          prev += d.insert?.length ?? 0;
        }
      }
      if (delta.length > 0) {
        model.text.applyDelta(delta);
      }
    }

    if (
      payload.type === 'block' &&
      payload.snapshot.flavour === 'affine:surface-ref'
    ) {
      const model = payload.model as SurfaceRefBlockModel;
      const original = model.reference;
      if (idMap.has(original)) {
        model.reference = idMap.get(original)!;
      } else {
        const newId = collection.idGenerator();
        idMap.set(original, newId);
        model.reference = newId;
      }
    }
  });
  slots.beforeImport.on(payload => {
    if (payload.type === 'page') {
      const newId = collection.idGenerator();
      idMap.set(payload.snapshot.meta.id, newId);
      payload.snapshot.meta.id = newId;
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
        newId = collection.idGenerator();
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
            newId = collection.idGenerator();
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

export const titleMiddleware: JobMiddleware = ({
  slots,
  collection,
  adapterConfigs,
}) => {
  slots.beforeExport.on(() => {
    for (const meta of collection.meta.docMetas) {
      adapterConfigs.set('title:' + meta.id, meta.title);
    }
  });
};

const imageProxyMiddlewareBuilder = () => {
  let middleware = customImageProxyMiddleware(DEFAULT_IMAGE_PROXY_ENDPOINT);
  return {
    get: () => middleware,
    set: (url: string) => {
      middleware = customImageProxyMiddleware(url);
    },
  };
};

const defaultImageProxyMiddlewarBuilder = imageProxyMiddlewareBuilder();

export const setImageProxyMiddlewareURL = defaultImageProxyMiddlewarBuilder.set;

export const defaultImageProxyMiddleware =
  defaultImageProxyMiddlewarBuilder.get();

export const embedSyncedDocMiddleware =
  (type: 'content'): JobMiddleware =>
  ({ adapterConfigs }) => {
    adapterConfigs.set('embedSyncedDocExportType', type);
  };
