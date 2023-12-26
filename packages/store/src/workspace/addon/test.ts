import { assertExists } from '@blocksuite/global/utils';

import type { JSXElement } from '../../utils/jsx.js';
import { serializeYDoc, yDocToJSXNode } from '../../utils/jsx.js';
import { addOnFactory } from './shared.js';

export interface TestAddon {
  importPageSnapshot: (json: unknown, pageId: string) => Promise<void>;
  exportJSX: (blockId?: string, pageId?: string) => JSXElement;
}

export const test = addOnFactory<keyof TestAddon>(
  originalClass =>
    class extends originalClass {
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
