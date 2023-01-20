import type { BaseBlockModel, Page } from '@blocksuite/store';
import { handleFormat } from '../../page-block/utils/index.js';
import { createLink } from '../../__internal__/rich-text/link-node/index.js';
import {
  BoldIcon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  RectIcon,
  StrikethroughIcon,
  TextIcon,
  UnderlineIcon,
} from '@blocksuite/global/config';
import {
  ConnectorIcon,
  GridIcon,
  penIcon,
  RedoIcon,
  SelectIcon,
  ShapeIcon,
  StickerIcon,
  UndoIcon,
} from '../icons.js';
import type { EdgelessToolBar } from '../edgeless/index.js';
import { createEvent } from '../../__internal__/index.js';

type ActionProps = {
  page: Page;
  abortController?: AbortController;
  /**
   * The current format of the selected text
   */
  format?: Record<string, unknown>;
};

export const formatConfig = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: 'command+b,ctrl+b',
    activeWhen: (format: Record<string, unknown>) => 'bold' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'bold');
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    hotkey: 'command+i,ctrl+i',
    activeWhen: (format: Record<string, unknown>) => 'italic' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'italic');
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    hotkey: 'command+u,ctrl+u',
    activeWhen: (format: Record<string, unknown>) => 'underline' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'underline');
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    hotkey: 'command+shift+s,ctrl+shift+s',
    activeWhen: (format: Record<string, unknown>) => 'strike' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'strike');
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: InlineCodeIcon,
    hotkey: 'command+e,ctrl+e',
    activeWhen: (format: Record<string, unknown>) => 'code' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'code');
    },
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    hotkey: 'command+k,ctrl+k',
    activeWhen: (format: Record<string, unknown>) => 'link' in format,
    // Only can show link button when selection is in one line paragraph
    showWhen: (models: BaseBlockModel[]) =>
      models.length === 1 && noneCodeBlockSelected(models),
    action: ({ page, abortController, format }: ActionProps) => {
      createLink(page);
      if (format && abortController && !('link' in format)) {
        abortController.abort();
      }
    },
  },
];

export const toolbarDrawConfig = [
  {
    id: 'select',
    name: 'select',
    icon: SelectIcon,
    tooltip: 'Select',
    disabled: true,
  },
  {
    id: 'text',
    name: 'text',
    icon: TextIcon,
    tooltip: 'Text',
    disabled: true,
  },
  {
    id: 'shape',
    name: 'shape',
    icon: ShapeIcon,
    tooltip: 'Shape',
    disabled: true,
  },
  {
    id: 'Sticky',
    name: 'Sticky',
    icon: StickerIcon,
    tooltip: 'Sticky',
    disabled: true,
  },
  {
    id: 'pen',
    name: 'pen',
    icon: penIcon,
    tooltip: 'Pen',
    disabled: true,
  },
  {
    id: 'connector',
    name: 'connector',
    icon: ConnectorIcon,
    tooltip: 'Connector',
    disabled: true,
  },
];

export const toolbarActionConfig = [
  {
    id: 'undo',
    name: 'undo',
    icon: UndoIcon,
    tooltip: 'Undo',
    disabled: false,
    action: (page: Page) => {
      page.undo();
    },
  },
  {
    id: 'redo',
    name: 'redo',
    icon: RedoIcon,
    tooltip: 'Redo',
    disabled: false,
    action: (page: Page) => {
      page.redo();
    },
  },
  {
    id: 'grid',
    name: 'grid',
    icon: (toolbar: EdgelessToolBar) => {
      return toolbar.showGrid ? GridIcon : RectIcon;
    },
    disabled: false,
    tooltip: 'Show Grid',
    action: (page: Page, toolbar: EdgelessToolBar) => {
      toolbar.showGrid = !toolbar.showGrid;
      window.dispatchEvent(
        createEvent('affine:switch-edgeless-display-mode', toolbar.showGrid)
      );
    },
  },
];

function noneCodeBlockSelected(models: BaseBlockModel[]) {
  return !models.every(model => model.flavour === 'affine:code');
}
