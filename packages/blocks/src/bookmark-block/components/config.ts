import { Slice, Workspace } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { toast } from '../../_common/components/toast.js';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  LinkIcon,
  RefreshIcon,
} from '../../_common/icons/index.js';
import type { BookmarkBlockModel } from '../bookmark-model.js';
import type { BookmarkOperationMenu } from './bookmark-operation-popper.js';

export type ConfigItem = {
  type: 'link' | 'card' | 'embed' | 'edit' | 'caption';
  icon: TemplateResult;
  tooltip: string;
  showWhen?: (model: BookmarkBlockModel) => boolean;
  disableWhen?: (model: BookmarkBlockModel) => boolean;
  action: (
    model: BookmarkBlockModel,
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

      const yText = new Workspace.Y.Text();
      const insert = model.title || model.caption || model.url;
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
    type: 'edit',
    icon: EditIcon,
    tooltip: 'Edit',
    showWhen: model => !model.page.readonly,
    action: (_model, callback) => {
      callback?.('edit');
    },
  },
  {
    type: 'caption',
    icon: CaptionIcon,
    tooltip: 'Add Caption',
    showWhen: model => !model.page.readonly,
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
    model: BookmarkBlockModel,
    callback?: MenuActionCallback,
    element?: BookmarkOperationMenu
  ) => void;
  showWhen?: (model: BookmarkBlockModel) => boolean;
  disableWhen?: (model: BookmarkBlockModel) => boolean;
  divider?: boolean;
};

export const moreOperations: MoreOperation[] = [
  {
    type: 'copy',
    icon: CopyIcon,
    label: 'Copy',
    action: async (model, callback, element) => {
      const slice = Slice.fromModels(model.page, [model]);
      await element?.std.clipboard.copySlice(slice);
      toast('Copied link to clipboard');
      callback?.('copy');
    },
  },
  {
    type: 'duplicate',
    icon: DuplicateIcon,
    label: 'Duplicate',
    showWhen: model => !model.page.readonly,
    action: (model, callback) => {
      const { page, url } = model;

      const parent = page.getParent(model);
      const index = parent?.children.indexOf(model);

      page.addBlock(
        'affine:bookmark',
        {
          url,
        },
        parent,
        index
      );

      callback?.('duplicate');
    },
  },
  {
    type: 'reload',
    icon: RefreshIcon,
    label: 'Reload',
    showWhen: model => !model.page.readonly,
    action: (_, callback) => {
      callback?.('reload');
    },
  },
  {
    type: 'delete',
    icon: DeleteIcon,
    label: 'Delete',
    showWhen: model => !model.page.readonly,
    action: (model, callback) => {
      model.page.deleteBlock(model);
      callback?.('delete');
    },
  },
];
