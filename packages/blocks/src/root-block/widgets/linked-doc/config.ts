import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import { type BlockModel, type DocMeta } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { toast } from '../../../_common/components/toast.js';
import {
  DocIcon,
  ImportIcon,
  NewDocIcon,
} from '../../../_common/icons/index.js';
import { REFERENCE_NODE } from '../../../_common/inline/presets/nodes/consts.js';
import { createDefaultDoc } from '../../../_common/utils/init.js';
import { getInlineEditorByModel } from '../../../_common/utils/query.js';
import { isFuzzyMatch } from '../../../_common/utils/string.js';
import { showImportModal } from './import-doc/index.js';

export type LinkedDocOptions = {
  triggerKeys: string[];
  ignoreBlockTypes: BlockSuite.Flavour[];
  convertTriggerKey: boolean;
  getMenus: (ctx: {
    editorHost: EditorHost;
    query: string;
    doc: Doc;
    docMetas: DocMeta[];
    model: BlockModel;
  }) => LinkedDocGroup[];
};

export type LinkedDocItem = {
  key: string;
  name: string;
  icon: TemplateResult<1>;
  // suffix?: TemplateResult<1>;
  // disabled?: boolean;
  action: () => Promise<void> | void;
};

export type LinkedDocGroup = {
  name: string;
  styles?: string;
  items: LinkedDocItem[];
};

const DEFAULT_DOC_NAME = 'Untitled';
const DISPLAY_NAME_LENGTH = 8;

export function insertLinkedNode({
  editorHost,
  model,
  docId,
}: {
  editorHost: EditorHost;
  model: BlockModel;
  docId: string;
}) {
  const inlineEditor = getInlineEditorByModel(editorHost, model);
  assertExists(inlineEditor, 'Editor not found');
  const inlineRange = inlineEditor.getInlineRange();
  assertExists(inlineRange);
  inlineEditor.insertText(inlineRange, REFERENCE_NODE, {
    reference: { type: 'LinkedPage', pageId: docId },
  });
  inlineEditor.setInlineRange({
    index: inlineRange.index + 1,
    length: 0,
  });
}

export const getMenus: (ctx: {
  editorHost: EditorHost;
  query: string;
  doc: Doc;
  docMetas: DocMeta[];
  model: BlockModel;
}) => LinkedDocGroup[] = ({ editorHost, query, doc, model, docMetas }) => {
  const docName = query || DEFAULT_DOC_NAME;
  const displayDocName =
    docName.slice(0, DISPLAY_NAME_LENGTH) +
    (docName.length > DISPLAY_NAME_LENGTH ? '..' : '');

  const filteredDocList = docMetas
    .filter(({ id }) => id !== doc.id)
    .filter(({ title }) => isFuzzyMatch(title, query));

  return [
    {
      name: 'Link to Doc',
      styles: 'overflow-y: scroll; max-height: 224px;',
      items: filteredDocList.map(doc => ({
        key: doc.id,
        name: doc.title || DEFAULT_DOC_NAME,
        icon: DocIcon,
        action: () =>
          insertLinkedNode({
            editorHost,
            model,
            docId: doc.id,
          }),
      })),
    },
    {
      name: 'New Doc',
      items: [
        {
          key: 'create',
          name: `Create "${displayDocName}" doc`,
          icon: NewDocIcon,
          action: () => {
            const docName = query;
            const newDoc = createDefaultDoc(doc.collection, {
              title: docName,
            });
            insertLinkedNode({
              editorHost,
              model,
              docId: newDoc.id,
            });
          },
        },
        {
          key: 'import',
          name: 'Import',
          icon: ImportIcon,
          action: () => {
            const onSuccess = (
              docIds: string[],
              options: {
                importedCount: number;
              }
            ) => {
              toast(
                editorHost,
                `Successfully imported ${options.importedCount} Doc${options.importedCount > 1 ? 's' : ''}.`
              );
              for (const docId of docIds) {
                insertLinkedNode({
                  editorHost,
                  model,
                  docId,
                });
              }
            };
            const onFail = (message: string) => {
              toast(editorHost, message);
            };
            showImportModal({
              collection: doc.collection,
              onSuccess,
              onFail,
            });
          },
        },
      ],
    },
  ] satisfies LinkedDocGroup[];
};
