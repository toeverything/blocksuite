import type { BaseBlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import * as Y from 'yjs';

import { toast } from '../..//components/toast.js';
import { copyBlocks } from '../../__internal__/clipboard/utils/commons.js';
import { getBlockElementByModel } from '../../__internal__/index.js';
import {
  BookmarkIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  EmbedIcon,
  LinkIcon,
  RefreshIcon,
} from '../../icons/index.js';
import type { BookmarkBlockComponent } from '../bookmark-block.js';
import type { BookmarkBlockModel, BookmarkProps } from '../bookmark-model.js';
import { allowEmbed } from '../embed/index.js';
import {
  cloneBookmarkProperties,
  reloadBookmarkBlock,
  tryGetBookmarkAPI,
} from '../utils.js';

export type ConfigItem = {
  type: 'link' | 'card' | 'embed' | 'edit' | 'caption';
  icon: TemplateResult;
  tooltip: string;
  showWhen?: (model: BaseBlockModel<BookmarkBlockModel>) => boolean;
  disableWhen?: (model: BaseBlockModel<BookmarkBlockModel>) => boolean;
  action: (
    model: BaseBlockModel<BookmarkBlockModel>,
    /**
     * @deprecated
     */
    callback?: ToolbarActionCallback,
    element?: HTMLElement
  ) => void;
  divider?: boolean;
};

export type ToolbarActionCallback = (type: ConfigItem['type']) => void;
export const config: ConfigItem[] = [
  {
    type: 'link',
    icon: LinkIcon,
    tooltip: 'Turn into Link view',
    disableWhen: model => model.page.readonly,
    action: (model, callback) => {
      const { page } = model;

      const parent = page.getParent(model);
      const index = parent?.children.indexOf(model);

      const yText = new Y.Text();
      const insert = model.bookmarkTitle || model.caption || model.url;
      yText.insert(0, insert);
      yText.format(0, insert.length, { link: model.url });
      const text = new page.Text(yText);
      page.addBlock(
        'affine:paragraph',
        {
          text,
        },
        parent,
        index
      );

      model.page.deleteBlock(model);
      callback?.('link');
    },
  },
  {
    type: 'card',
    icon: BookmarkIcon,
    tooltip: 'Turn into Card view',
    showWhen: model => model.type && model.type !== 'card',
    disableWhen: model => model.page.readonly,
    action: (model, callback) => {
      model.page.updateBlock<Partial<BookmarkProps>>(model, {
        type: 'card',
      });
      callback?.('card');
    },
    divider: true,
  },
  {
    type: 'embed',
    icon: EmbedIcon,
    tooltip: 'Turn into Embed view',
    showWhen: model => model.type !== 'embed' && allowEmbed(model.url),
    disableWhen: model => model.page.readonly,
    action: (model, callback) => {
      model.page.updateBlock<Partial<BookmarkProps>>(model, {
        type: 'embed',
      });
      callback?.('embed');
    },
    divider: true,
  },
  {
    type: 'edit',
    icon: EditIcon,
    tooltip: 'Edit',
    disableWhen: model => model.page.readonly,
    action: (_model, callback) => {
      callback?.('edit');
    },
  },
  {
    type: 'caption',
    icon: CaptionIcon,
    tooltip: 'Add Caption',
    disableWhen: model => model.page.readonly,
    action: (_model, callback) => {
      callback?.('caption');
    },
    divider: true,
  },
];

export type MenuActionCallback = (type: MoreOperation['type']) => void;

type MoreOperation = {
  type: 'reload' | 'copy' | 'delete' | 'duplicate';
  icon: TemplateResult;
  label: string;
  action: (
    model: BaseBlockModel<BookmarkBlockModel>,
    callback?: MenuActionCallback,
    element?: HTMLElement
  ) => void;
  showWhen?: (model: BaseBlockModel<BookmarkBlockModel>) => boolean;
  disableWhen?: (model: BaseBlockModel<BookmarkBlockModel>) => boolean;
  divider?: boolean;
};

export const moreOperations: MoreOperation[] = [
  {
    type: 'copy',
    icon: CopyIcon,
    label: 'Copy',
    action: async (model, callback) => {
      await copyBlocks([model]);
      toast('Copied link to clipboard');
      callback?.('copy');
    },
  },
  {
    type: 'duplicate',
    icon: DuplicateIcon,
    label: 'Duplicate',
    disableWhen: model => model.page.readonly,
    action: (model, callback) => {
      const { page } = model;

      const parent = page.getParent(model);
      const index = parent?.children.indexOf(model);

      const clonedProps = cloneBookmarkProperties(model);

      page.addBlock('affine:bookmark', clonedProps, parent, index);

      callback?.('duplicate');
    },
  },
  {
    type: 'reload',
    icon: RefreshIcon,
    label: 'Reload',
    disableWhen: model => model.page.readonly || !tryGetBookmarkAPI(),
    action: (model, callback) => {
      reloadBookmarkBlock(
        model,
        getBlockElementByModel(model) as BookmarkBlockComponent,
        true
      );
      callback?.('reload');
    },
  },
  {
    type: 'delete',
    icon: DeleteIcon,
    label: 'Delete',
    disableWhen: model => model.page.readonly,
    action: (model, callback) => {
      model.page.deleteBlock(model);
      callback?.('delete');
    },
  },
];
