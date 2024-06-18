import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { DocMeta } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { toast } from '../../../_common/components/toast.js';
import {
  DocIcon,
  ImportIcon,
  NewDocIcon,
} from '../../../_common/icons/index.js';
import type { AffineInlineEditor } from '../../../_common/inline/presets/affine-inline-specs.js';
import { REFERENCE_NODE } from '../../../_common/inline/presets/nodes/consts.js';
import { createDefaultDoc } from '../../../_common/utils/init.js';
import { isFuzzyMatch } from '../../../_common/utils/string.js';
import { showImportModal } from './import-doc/index.js';

export type LinkedDocOptions = {
  triggerKeys: string[];
  ignoreBlockTypes: BlockSuite.Flavour[];
  convertTriggerKey: boolean;
  getMenus: (ctx: {
    editorHost: EditorHost;
    query: string;
    inlineEditor: AffineInlineEditor;
    docMetas: DocMeta[];
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
  inlineEditor,
  docId,
}: {
  inlineEditor: AffineInlineEditor;
  docId: string;
}) {
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
  inlineEditor: AffineInlineEditor;
  docMetas: DocMeta[];
}) => LinkedDocGroup[] = ({ editorHost, query, inlineEditor, docMetas }) => {
  const doc = editorHost.doc;
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
        action: () => {
          insertLinkedNode({
            inlineEditor,
            docId: doc.id,
          });
          editorHost.spec
            .getService('affine:page')
            .telemetryService?.track('LinkedDocCreated', {
              control: 'linked doc',
              module: 'inline @',
              type: 'doc',
              other: 'existing doc',
            });
        },
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
              inlineEditor,
              docId: newDoc.id,
            });
            const telemetryService =
              editorHost.spec.getService('affine:page').telemetryService;
            telemetryService?.track('LinkedDocCreated', {
              control: 'new doc',
              module: 'inline @',
              type: 'doc',
              other: 'new doc',
            });
            telemetryService?.track('DocCreated', {
              control: 'new doc',
              module: 'inline @',
              type: 'doc',
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
                  inlineEditor,
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
