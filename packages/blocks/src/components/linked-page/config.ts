import { ImportIcon, NewPageIcon, PageIcon } from '@blocksuite/global/config';
import type { Page } from '@blocksuite/store';
import {
  assertExists,
  type BaseBlockModel,
  type PageMeta,
} from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { REFERENCE_NODE } from '../../__internal__/rich-text/reference-node.js';
import { isFuzzyMatch } from '../../__internal__/utils/common.js';
import { createPage } from '../../__internal__/utils/common-operations.js';
import { getVirgoByModel } from '../../__internal__/utils/query.js';
import { showImportModal } from '../import-page/index.js';

export type LinkedPageOptions = {
  triggerKeys: string[];
  ignoreBlockTypes: string[];
  convertTriggerKey: boolean;
  getMenus: (ctx: {
    query: string;
    page: Page;
    pageMetas: PageMeta[];
    model: BaseBlockModel;
  }) => LinkedPageGroup[];
};

export type LinkedPageItem = {
  key: string;
  name: string;
  icon: TemplateResult<1>;
  // suffix?: TemplateResult<1>;
  // disabled?: boolean;
  action: () => void;
};

export type LinkedPageGroup = {
  name: string;
  styles?: string;
  items: LinkedPageItem[];
};

const DEFAULT_PAGE_NAME = 'Untitled';
const DISPLAY_NAME_LENGTH = 8;

export function insertLinkedNode({
  model,
  pageId,
}: {
  pageId: string;
  model: BaseBlockModel;
}) {
  const vEditor = getVirgoByModel(model);
  assertExists(vEditor, 'Editor not found');
  const vRange = vEditor.getVRange();
  assertExists(vRange);
  vEditor.insertText(vRange, REFERENCE_NODE, {
    reference: { type: 'LinkedPage', pageId },
  });
  vEditor.setVRange({
    index: vRange.index + 1,
    length: 0,
  });
}

export const getMenus: (ctx: {
  query: string;
  page: Page;
  pageMetas: PageMeta[];
  model: BaseBlockModel;
}) => LinkedPageGroup[] = ({ query, page, model, pageMetas }) => {
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
            const newPage = await createPage(page.workspace, {
              title: pageName,
            });
            insertLinkedNode({
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
              if (pageIds.length === 0) {
                return;
              }
              const pageId = pageIds[0];
              insertLinkedNode({
                model,
                pageId: pageId,
              });
            };
            showImportModal({
              workspace: page.workspace,
              multiple: false,
              onSuccess,
            });
          },
        },
      ],
    },
  ] satisfies LinkedPageGroup[];
};
