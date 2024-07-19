import { assertExists } from '@blocksuite/global/utils';

import type { JSXElement } from '../../utils/jsx.js';

import { serializeYDoc, yDocToJSXNode } from '../../utils/jsx.js';
import { addOnFactory } from './shared.js';

export interface TestAddon {
  importDocSnapshot: (json: unknown, docId: string) => Promise<void>;
  exportJSX: (blockId?: string, docId?: string) => JSXElement;
}

export const test = addOnFactory<keyof TestAddon>(
  originalClass =>
    class extends originalClass {
      /** @internal Only for testing */
      exportJSX(blockId?: string, docId = this.meta.docMetas.at(0)?.id) {
        assertExists(docId);
        const doc = this.doc.spaces.get(docId);
        assertExists(doc);
        const docJson = serializeYDoc(doc);
        if (!docJson) {
          throw new Error(`Doc ${docId} doesn't exist`);
        }
        const blockJson = docJson.blocks as Record<string, unknown>;
        if (!blockId) {
          const rootId = Object.keys(blockJson).at(0);
          if (!rootId) {
            return null;
          }
          blockId = rootId;
        }
        if (!blockJson[blockId]) {
          return null;
        }
        return yDocToJSXNode(blockJson, blockId);
      }
    }
);
