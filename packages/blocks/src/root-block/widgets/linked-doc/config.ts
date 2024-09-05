import type { EditorHost } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import {
  ImportIcon,
  LinkedDocIcon,
  LinkedEdgelessIcon,
  NewDocIcon,
} from '@blocksuite/affine-components/icons';
import {
  type AffineInlineEditor,
  insertLinkedNode,
} from '@blocksuite/affine-components/rich-text';
import { toast } from '@blocksuite/affine-components/toast';
import {
  DocModeProvider,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import {
  createDefaultDoc,
  isFuzzyMatch,
} from '@blocksuite/affine-shared/utils';

import { showImportModal } from './import-doc/index.js';

export type LinkedMenuItem = {
  key: string;
  name: string;
  icon: TemplateResult<1>;
  // suffix?: TemplateResult<1>;
  // disabled?: boolean;
  action: () => Promise<void> | void;
};

export type LinkedMenuGroup = {
  name: string;
  items: LinkedMenuItem[];
  styles?: string;
  // maximum quantity displayed by default
  maxDisplay?: number;
  // copywriting when display quantity exceeds
  overflowText?: string;
};

const DEFAULT_DOC_NAME = 'Untitled';
const DISPLAY_NAME_LENGTH = 8;

export function createLinkedDocMenuGroup(
  query: string,
  abort: () => void,
  editorHost: EditorHost,
  inlineEditor: AffineInlineEditor
) {
  const doc = editorHost.doc;
  const { docMetas } = doc.collection.meta;
  const filteredDocList = docMetas
    .filter(({ id }) => id !== doc.id)
    .filter(({ title }) => isFuzzyMatch(title, query));
  const MAX_DOCS = 6;

  return {
    name: 'Link to Doc',
    items: filteredDocList.map(doc => ({
      key: doc.id,
      name: doc.title || DEFAULT_DOC_NAME,
      icon:
        editorHost.std.get(DocModeProvider).getPrimaryMode(doc.id) ===
        'edgeless'
          ? LinkedEdgelessIcon
          : LinkedDocIcon,
      action: () => {
        abort();
        insertLinkedNode({
          inlineEditor,
          docId: doc.id,
        });
        editorHost.std
          .getOptional(TelemetryProvider)
          ?.track('LinkedDocCreated', {
            control: 'linked doc',
            module: 'inline @',
            type: 'doc',
            other: 'existing doc',
          });
      },
    })),
    maxDisplay: MAX_DOCS,
    overflowText: `${filteredDocList.length - MAX_DOCS} more docs`,
  };
}

export function createNewDocMenuGroup(
  query: string,
  abort: () => void,
  editorHost: EditorHost,
  inlineEditor: AffineInlineEditor
): LinkedMenuGroup {
  const doc = editorHost.doc;
  const docName = query || DEFAULT_DOC_NAME;
  const displayDocName =
    docName.slice(0, DISPLAY_NAME_LENGTH) +
    (docName.length > DISPLAY_NAME_LENGTH ? '..' : '');

  return {
    name: 'New Doc',
    items: [
      {
        key: 'create',
        name: `Create "${displayDocName}" doc`,
        icon: NewDocIcon,
        action: () => {
          abort();
          const docName = query;
          const newDoc = createDefaultDoc(doc.collection, {
            title: docName,
          });
          insertLinkedNode({
            inlineEditor,
            docId: newDoc.id,
          });
          const telemetryService =
            editorHost.std.getOptional(TelemetryProvider);
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
  };
}

export function getMenus(
  query: string,
  abort: () => void,
  editorHost: EditorHost,
  inlineEditor: AffineInlineEditor
): Promise<LinkedMenuGroup[]> {
  return Promise.resolve([
    createLinkedDocMenuGroup(query, abort, editorHost, inlineEditor),
    createNewDocMenuGroup(query, abort, editorHost, inlineEditor),
  ]);
}

export const LinkedWidgetUtils = {
  createLinkedDocMenuGroup,
  createNewDocMenuGroup,
  insertLinkedNode,
};
