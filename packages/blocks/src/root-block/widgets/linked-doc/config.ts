import type { EditorHost } from '@blocksuite/block-std';
import type { DocMeta } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { assertExists } from '@blocksuite/global/utils';

import type { AffineInlineEditor } from '../../../_common/inline/presets/affine-inline-specs.js';

import { toast } from '../../../_common/components/toast.js';
import {
  ImportIcon,
  LinkedDocIcon,
  LinkedEdgelessIcon,
  NewDocIcon,
} from '../../../_common/icons/index.js';
import { REFERENCE_NODE } from '../../../_common/inline/presets/nodes/consts.js';
import { createDefaultDoc } from '../../../_common/utils/init.js';
import { isFuzzyMatch } from '../../../_common/utils/string.js';
import { showImportModal } from './import-doc/index.js';

interface MenuCtx {
  abort: () => void;
  docMetas: DocMeta[];
  editorHost: EditorHost;
  inlineEditor: AffineInlineEditor;
  query: string;
}

export type LinkedDocOptions = {
  convertTriggerKey: boolean;
  getMenus: (ctx: MenuCtx) => LinkedDocGroup[];
  ignoreBlockTypes: BlockSuite.Flavour[];
  triggerKeys: string[];
};

export type LinkedDocItem = {
  // disabled?: boolean;
  action: () => Promise<void> | void;
  icon: TemplateResult<1>;
  key: string;
  // suffix?: TemplateResult<1>;
  name: string;
};

export type LinkedDocGroup = {
  items: LinkedDocItem[];
  // maximum quantity displayed by default
  maxDisplay?: number;
  name: string;
  // copywriting when display quantity exceeds
  overflowText?: string;
  styles?: string;
};

const DEFAULT_DOC_NAME = 'Untitled';
const DISPLAY_NAME_LENGTH = 8;

export function insertLinkedNode({
  docId,
  inlineEditor,
}: {
  docId: string;
  inlineEditor: AffineInlineEditor;
}) {
  assertExists(inlineEditor, 'Editor not found');
  const inlineRange = inlineEditor.getInlineRange();
  assertExists(inlineRange);
  inlineEditor.insertText(inlineRange, REFERENCE_NODE, {
    reference: { pageId: docId, type: 'LinkedPage' },
  });
  inlineEditor.setInlineRange({
    index: inlineRange.index + 1,
    length: 0,
  });
}

export const getMenus: (ctx: MenuCtx) => LinkedDocGroup[] = ({
  abort,
  docMetas,
  editorHost,
  inlineEditor,
  query,
}) => {
  const doc = editorHost.doc;
  const { docModeService } = editorHost.std.spec.getService('affine:page');
  const docName = query || DEFAULT_DOC_NAME;
  const displayDocName =
    docName.slice(0, DISPLAY_NAME_LENGTH) +
    (docName.length > DISPLAY_NAME_LENGTH ? '..' : '');

  const filteredDocList = docMetas
    .filter(({ id }) => id !== doc.id)
    .filter(({ title }) => isFuzzyMatch(title, query));
  const MAX_DOCS = 6;

  return [
    {
      items: filteredDocList.map(doc => ({
        action: () => {
          abort();
          insertLinkedNode({
            docId: doc.id,
            inlineEditor,
          });
          editorHost.spec
            .getService('affine:page')
            .telemetryService?.track('LinkedDocCreated', {
              control: 'linked doc',
              module: 'inline @',
              other: 'existing doc',
              type: 'doc',
            });
        },
        icon:
          docModeService.getMode(doc.id) === 'edgeless'
            ? LinkedEdgelessIcon
            : LinkedDocIcon,
        key: doc.id,
        name: doc.title || DEFAULT_DOC_NAME,
      })),
      maxDisplay: MAX_DOCS,
      name: 'Link to Doc',
      overflowText: `${filteredDocList.length - MAX_DOCS} more docs`,
    },
    {
      items: [
        {
          action: () => {
            abort();
            const docName = query;
            const newDoc = createDefaultDoc(doc.collection, {
              title: docName,
            });
            insertLinkedNode({
              docId: newDoc.id,
              inlineEditor,
            });
            const telemetryService =
              editorHost.spec.getService('affine:page').telemetryService;
            telemetryService?.track('LinkedDocCreated', {
              control: 'new doc',
              module: 'inline @',
              other: 'new doc',
              type: 'doc',
            });
            telemetryService?.track('DocCreated', {
              control: 'new doc',
              module: 'inline @',
              type: 'doc',
            });
          },
          icon: NewDocIcon,
          key: 'create',
          name: `Create "${displayDocName}" doc`,
        },
        {
          action: () => {
            abort();
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
                  docId,
                  inlineEditor,
                });
              }
            };
            const onFail = (message: string) => {
              toast(editorHost, message);
            };
            showImportModal({
              collection: doc.collection,
              onFail,
              onSuccess,
            });
          },
          icon: ImportIcon,
          key: 'import',
          name: 'Import',
        },
      ],
      name: 'New Doc',
    },
  ] satisfies LinkedDocGroup[];
};
