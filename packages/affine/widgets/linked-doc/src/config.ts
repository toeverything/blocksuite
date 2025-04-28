import {
  ImportIcon,
  LinkedDocIcon,
  LinkedEdgelessIcon,
  NewDocIcon,
} from '@blocksuite/affine-components/icons';
import { toast } from '@blocksuite/affine-components/toast';
import { StoreExtensionManagerIdentifier } from '@blocksuite/affine-ext-loader';
import { insertLinkedNode } from '@blocksuite/affine-inline-reference';
import {
  DocModeProvider,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import type { AffineInlineEditor } from '@blocksuite/affine-shared/types';
import {
  createDefaultDoc,
  isFuzzyMatch,
  type Signal,
} from '@blocksuite/affine-shared/utils';
import { IS_MOBILE } from '@blocksuite/global/env';
import {
  type BlockStdScope,
  ConfigExtensionFactory,
  type EditorHost,
} from '@blocksuite/std';
import type { InlineRange } from '@blocksuite/std/inline';
import type { TemplateResult } from 'lit';

import { showImportModal } from './import-doc/index.js';

export interface LinkedWidgetConfig {
  /**
   * The first item of the trigger keys will be the primary key
   * e.g. @, [[
   */
  triggerKeys: [string, ...string[]];
  /**
   * Convert trigger key to primary key (the first item of the trigger keys)
   * [[ -> @
   */
  convertTriggerKey: boolean;
  ignoreBlockTypes: string[];
  ignoreSelector: string;
  getMenus: (
    query: string,
    abort: () => void,
    editorHost: EditorHost,
    inlineEditor: AffineInlineEditor,
    abortSignal: AbortSignal
  ) => Promise<LinkedMenuGroup[]> | LinkedMenuGroup[];

  /**
   * Auto focused item
   *
   * Will be called when the menu is
   * - opened
   * - query changed
   * - menu group or its items changed
   *
   * If the return value is not null, no action will be taken.
   */
  autoFocusedItemKey?: (
    menus: LinkedMenuGroup[],
    query: string,
    currentActiveKey: string | null,
    editorHost: EditorHost,
    inlineEditor: AffineInlineEditor
  ) => string | null;

  mobile: {
    /**
     * The linked doc menu widget will scroll the container to make sure the input cursor is visible in viewport.
     * It accepts a selector string, HTMLElement or Window
     *
     * @default getViewportElement(editorHost) this is the scrollable container in playground
     */
    scrollContainer?: string | HTMLElement | Window;
    /**
     * The offset between the top of viewport and the input cursor
     *
     * @default 46 The height of header in playground
     */
    scrollTopOffset?: number | (() => number);
  };
}

export type LinkedMenuItem = {
  key: string;
  name: string | TemplateResult<1>;
  icon: TemplateResult<1>;
  suffix?: string | TemplateResult<1>;
  // disabled?: boolean;
  action: LinkedMenuAction;
};

export type LinkedMenuAction = () => Promise<void> | void;

export type LinkedMenuGroup = {
  name: string;
  items: LinkedMenuItem[] | Signal<LinkedMenuItem[]>;
  styles?: string;
  // maximum quantity displayed by default
  maxDisplay?: number;
  // if the menu is loading
  loading?: boolean | Signal<boolean>;
  // copywriting when display quantity exceeds
  overflowText?: string | Signal<string>;
  // hide the group
  hidden?: boolean | Signal<boolean>;
};

export type LinkedDocContext = {
  std: BlockStdScope;
  inlineEditor: AffineInlineEditor;
  startRange: InlineRange;
  startNativeRange: Range;
  triggerKey: string;
  config: LinkedWidgetConfig;
  close: () => void;
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
  const { docMetas } = doc.workspace.meta;
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

  const items: LinkedMenuItem[] = [
    {
      key: 'create',
      name: `Create "${displayDocName}" doc`,
      icon: NewDocIcon,
      action: () => {
        abort();
        const docName = query;
        const newDoc = createDefaultDoc(doc.workspace, {
          title: docName,
        });
        insertLinkedNode({
          inlineEditor,
          docId: newDoc.id,
        });
        const telemetryService = editorHost.std.getOptional(TelemetryProvider);
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
  ];

  if (!IS_MOBILE) {
    items.push({
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
        const storeManager = editorHost.std.get(
          StoreExtensionManagerIdentifier
        );
        showImportModal({
          collection: doc.workspace,
          schema: doc.schema,
          extensions: storeManager.get('store'),
          onSuccess,
          onFail,
        });
      },
    });
  }

  return {
    name: 'New Doc',
    items,
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

export const AFFINE_LINKED_DOC_WIDGET = 'affine-linked-doc-widget';

export const LinkedWidgetConfigExtension = ConfigExtensionFactory<
  Partial<LinkedWidgetConfig>
>('affine:widget-linked-doc');
