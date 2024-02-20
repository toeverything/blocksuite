import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { type BlockModel, type PageMeta } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { toast } from '../../../_common/components/toast.js';
import {
  ImportIcon,
  NewPageIcon,
  PageIcon,
} from '../../../_common/icons/index.js';
import { REFERENCE_NODE } from '../../../_common/inline/presets/nodes/consts.js';
import { createDefaultPage } from '../../../_common/utils/init.js';
import { getInlineEditorByModel } from '../../../_common/utils/query.js';
import { isFuzzyMatch } from '../../../_common/utils/string.js';
import type { Flavour } from '../../../models.js';
import { showImportModal } from './import-doc/index.js';

export type LinkedDocOptions = {
  triggerKeys: string[];
  ignoreBlockTypes: Flavour[];
  convertTriggerKey: boolean;
  getMenus: (ctx: {
    editorHost: EditorHost;
    query: string;
    page: Page;
    pageMetas: PageMeta[];
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

const DEFAULT_PAGE_NAME = 'Untitled';
const DISPLAY_NAME_LENGTH = 8;

export function insertLinkedNode({
  editorHost,
  model,
  pageId,
}: {
  editorHost: EditorHost;
  pageId: string;
  model: BlockModel;
}) {
  const inlineEditor = getInlineEditorByModel(editorHost, model);
  assertExists(inlineEditor, 'Editor not found');
  const inlineRange = inlineEditor.getInlineRange();
  assertExists(inlineRange);
  inlineEditor.insertText(inlineRange, REFERENCE_NODE, {
    reference: { type: 'LinkedPage', pageId },
  });
  inlineEditor.setInlineRange({
    index: inlineRange.index + 1,
    length: 0,
  });
}

export const getMenus: (ctx: {
  editorHost: EditorHost;
  query: string;
  page: Page;
  pageMetas: PageMeta[];
  model: BlockModel;
}) => LinkedDocGroup[] = ({ editorHost, query, page, model, pageMetas }) => {
  const pageName = query || DEFAULT_PAGE_NAME;
  const displayPageName =
    pageName.slice(0, DISPLAY_NAME_LENGTH) +
    (pageName.length > DISPLAY_NAME_LENGTH ? '..' : '');

  const filteredPageList = pageMetas
    .filter(({ id }) => id !== page.id)
    .filter(({ title }) => isFuzzyMatch(title, query));

  return [
    {
      name: 'Link to Doc',
      styles: 'overflow-y: scroll; max-height: 224px;',
      items: filteredPageList.map(page => ({
        key: page.id,
        name: page.title || DEFAULT_PAGE_NAME,
        icon: PageIcon,
        action: () =>
          insertLinkedNode({
            editorHost,
            model,
            pageId: page.id,
          }),
      })),
    },
    {
      name: 'New Doc',
      items: [
        {
          key: 'create',
          name: `Create "${displayPageName}" doc`,
          icon: NewPageIcon,
          action: () => {
            const pageName = query;
            const newPage = createDefaultPage(page.workspace, {
              title: pageName,
            });
            insertLinkedNode({
              editorHost,
              model,
              pageId: newPage.id,
            });
          },
        },
        {
          key: 'import',
          name: 'Import',
          icon: ImportIcon,
          action: () => {
            const onSuccess = (pageIds: string[]) => {
              toast(
                editorHost,
                `Successfully imported ${pageIds.length} Page${
                  pageIds.length > 1 ? 's' : ''
                }.`
              );
              if (pageIds.length === 0) {
                return;
              }
              const pageId = pageIds[0];
              insertLinkedNode({
                editorHost,
                model,
                pageId: pageId,
              });
            };
            showImportModal({
              workspace: page.workspace,
              onSuccess,
            });
          },
        },
      ],
    },
  ] satisfies LinkedDocGroup[];
};
