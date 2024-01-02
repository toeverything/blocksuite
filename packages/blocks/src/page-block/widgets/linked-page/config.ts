import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { type BlockModel, type PageMeta } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { REFERENCE_NODE } from '../../../_common/components/rich-text/consts.js';
import { toast } from '../../../_common/components/toast.js';
import {
  ImportIcon,
  NewPageIcon,
  PageIcon,
} from '../../../_common/icons/index.js';
import { createDefaultPage } from '../../../_common/utils/init.js';
import { getInlineEditorByModel } from '../../../_common/utils/query.js';
import { isFuzzyMatch } from '../../../_common/utils/string.js';
import type { Flavour } from '../../../models.js';
import { showImportModal } from './import-page/index.js';

export type LinkedPageOptions = {
  triggerKeys: string[];
  ignoreBlockTypes: Flavour[];
  convertTriggerKey: boolean;
  getMenus: (ctx: {
    editorHost: EditorHost;
    query: string;
    page: Page;
    pageMetas: PageMeta[];
    model: BlockModel;
  }) => LinkedPageGroup[];
};

export type LinkedPageItem = {
  key: string;
  name: string;
  icon: TemplateResult<1>;
  // suffix?: TemplateResult<1>;
  // disabled?: boolean;
  action: () => Promise<void> | void;
};

export type LinkedPageGroup = {
  name: string;
  styles?: string;
  items: LinkedPageItem[];
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
}) => LinkedPageGroup[] = ({ editorHost, query, page, model, pageMetas }) => {
  const pageName = query || DEFAULT_PAGE_NAME;
  const displayPageName =
    pageName.slice(0, DISPLAY_NAME_LENGTH) +
    (pageName.length > DISPLAY_NAME_LENGTH ? '..' : '');

  const filteredPageList = pageMetas
    .filter(({ id }) => id !== page.id)
    .filter(({ title }) => isFuzzyMatch(title, query));

  return [
    {
      name: 'Link to Page',
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
      name: 'New page',
      items: [
        {
          key: 'create',
          name: `Create "${displayPageName}" page`,
          icon: NewPageIcon,
          action: async () => {
            const pageName = query;
            const newPage = await createDefaultPage(page.workspace, {
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
  ] satisfies LinkedPageGroup[];
};
