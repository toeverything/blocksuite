import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { JSXElement } from '../../utils/jsx.js';
import { serializeYDoc, yDocToJSXNode } from '../../utils/jsx.js';
import { native2Y, NativeWrapper, Text } from '../../yjs/index.js';
import type { Page } from '../page.js';
import { addOnFactory } from './shared.js';

export interface TestAddon {
  importPageSnapshot: (json: unknown, pageId: string) => Promise<void>;
  exportPageSnapshot: (pageId: string) => Record<string, unknown>;
  exportPageYDoc: (pageId: string) => void;
  exportJSX: (blockId?: string, pageId?: string) => JSXElement;
}

export const test = addOnFactory<keyof TestAddon>(
  originalClass =>
    class extends originalClass {
      /**
       * @internal
       * Import an object expression of a page.
       * Specify the page you want to update by passing the `pageId` parameter and it will
       * create a new page if it does not exist.
       */
      async importPageSnapshot(json: unknown, pageId: string) {
        const unprefix = (str: string) =>
          str.replace('sys:', '').replace('prop:', '').replace('space:', '');
        const visited = new Set();
        let page = this.getPage(pageId);
        if (page) {
          page.clear();
        } else {
          page = this.createPage({ id: pageId });
        }

        const sanitize = async (props: Record<string, unknown>) => {
          const result: Record<string, unknown> = {};

          // TODO: https://github.com/toeverything/blocksuite/issues/2939
          if (
            props['sys:flavour'] === 'affine:surface' &&
            props['prop:elements']
          ) {
            const obj = (
              props['prop:elements'] as { value: Record<string, unknown> }
            ).value;
            const wrapper = new Y.Map();
            Object.entries(obj).forEach(([key, element]) => {
              const _element = element as Record<string, unknown>;
              if (_element['type'] === 'text') {
                const yText = new Y.Text();
                yText.applyDelta(_element['text']);
                _element['text'] = yText;
              }
              if (_element['type'] === 'frame') {
                const yText = new Y.Text();
                yText.applyDelta(_element['title']);
                _element['title'] = yText;
              }
              if (_element['type'] === 'shape' && _element['text']) {
                const yText = new Y.Text();
                yText.applyDelta(_element['text']);
                _element['text'] = yText;
              }
              wrapper.set(key, native2Y(_element, false));
            });

            props['prop:elements'] = new NativeWrapper(wrapper);
          }

          // setup embed source
          if (props['sys:flavour'] === 'affine:image') {
            const maybeUrl = props['prop:sourceId'];
            if (typeof maybeUrl !== 'string') {
              throw new Error('Embed source is not a string');
            }
            if (maybeUrl.startsWith('http')) {
              try {
                const resp = await fetch(maybeUrl, {
                  cache: 'no-cache',
                  mode: 'cors',
                  headers: {
                    Origin: window.location.origin,
                  },
                });
                const imgBlob = await resp.blob();
                if (!imgBlob.type.startsWith('image/')) {
                  throw new Error('Embed source is not an image');
                }

                assertExists(page);
                const storage = page.blobs;
                assertExists(storage);
                props['prop:sourceId'] = (await storage.set(imgBlob)) as never;
              } catch (e) {
                console.error('Failed to fetch embed source');
                console.error(e);
              }
            }
          }

          if (props['sys:flavour'] === 'affine:database') {
            const columns = props['prop:columns'] as Record<string, string>[];
            const richTextColumns = columns.filter(
              cell => cell.type === 'rich-text'
            );

            const cells = props['prop:cells'] as Record<string, unknown>;
            richTextColumns.forEach(richText => {
              Object.keys(cells).forEach(key => {
                const cellValue = cells[key] as Record<string, unknown>;
                const richTextValue = cellValue[richText.id] as Record<
                  string,
                  unknown
                >;
                if (!richTextValue) return;
                if (Array.isArray(richTextValue.value)) {
                  const yText = new Y.Text();
                  yText.applyDelta(richTextValue.value);
                  richTextValue.value = new Text(yText).yText;
                }
              });
            });
          }

          Object.keys(props).forEach(key => {
            if (key === 'sys:children' || key === 'sys:flavour') {
              return;
            }

            result[unprefix(key)] = props[key];
            if (key === 'prop:text' || key === 'prop:title') {
              const yText = new Y.Text();
              yText.applyDelta(props[key]);
              result[unprefix(key)] = new Text(yText);
            }
          });
          return result;
        };

        const { blocks } = json as Record<string, never>;
        assertExists(blocks, 'Snapshot structure is invalid');

        const addBlockByProps = async (
          page: Page,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          props: any,
          parent?: string
        ) => {
          const id = props['sys:id'] as string;
          if (visited.has(id)) return;
          const sanitizedProps = await sanitize(props);
          page.addBlock(props['sys:flavour'], sanitizedProps, parent);
          await props['sys:children'].reduce(
            async (prev: Promise<unknown>, childId: string) => {
              await prev;
              await addBlockByProps(page, blocks[childId], id);
              visited.add(childId);
            },
            Promise.resolve()
          );
        };

        const root = Object.values(blocks).find(block => {
          const _block = block as Record<string, unknown>;
          const flavour = _block['sys:flavour'] as string;
          const schema = this.schema.flavourSchemaMap.get(flavour);
          return schema?.model?.role === 'root';
        });
        await addBlockByProps(page, root);
      }

      exportPageSnapshot(pageId: string) {
        const page = this.getPage(pageId);
        assertExists(page, `page ${pageId} not found`);
        return serializeYDoc(page.spaceDoc);
      }

      exportSnapshot() {
        return serializeYDoc(this.doc);
      }

      /**
       * @internal Only for testing
       */
      exportPageYDoc(pageId: string) {
        const pages = this.doc.getMap('spaces');
        const pageDoc = pages.get(pageId);

        if (!(pageDoc instanceof Y.Doc)) {
          throw new Error(`Page ${pageId} not found or not a Y.Doc`);
        }

        const binary = Y.encodeStateAsUpdate(pageDoc);
        const file = new Blob([binary], { type: 'application/octet-stream' });
        const fileUrl = URL.createObjectURL(file);

        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'workspace.ydoc';
        link.click();

        URL.revokeObjectURL(fileUrl);
      }

      /** @internal Only for testing */
      exportJSX(blockId?: string, pageId = this.meta.pageMetas.at(0)?.id) {
        assertExists(pageId);
        const doc = this.doc.spaces.get(pageId);
        assertExists(doc);
        const pageJson = serializeYDoc(doc);
        if (!pageJson) {
          throw new Error(`Page ${pageId} doesn't exist`);
        }
        const blockJson = pageJson.blocks as Record<string, unknown>;
        if (!blockId) {
          const pageBlockId = Object.keys(blockJson).at(0);
          if (!pageBlockId) {
            return null;
          }
          blockId = pageBlockId;
        }
        if (!blockJson[blockId]) {
          return null;
        }
        return yDocToJSXNode(blockJson, blockId);
      }
    }
);
