import type { FrameBlockModel } from '@blocksuite/affine-model';
import type { TemplateResult } from 'lit';

import {
  ArrowDownBigIcon,
  ArrowUpBigIcon,
  AttachmentIcon,
  BlockLinkIcon,
  BoldIcon,
  BulletedListIcon,
  CheckBoxCheckLinearIcon,
  CloseIcon,
  CodeBlockIcon,
  CodeIcon,
  CopyIcon,
  DatabaseKanbanViewIcon,
  DatabaseTableViewIcon,
  DeleteIcon,
  DividerIcon,
  DuplicateIcon,
  FigmaDuotoneIcon,
  FontIcon,
  FrameIcon,
  GithubIcon,
  GroupIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  HighLightDuotoneIcon,
  ItalicIcon,
  LinkedPageIcon,
  LinkIcon,
  LoomLogoIcon,
  NewPageIcon,
  NowIcon,
  NumberedListIcon,
  PlusIcon,
  QuoteIcon,
  RedoIcon,
  StrikeThroughIcon,
  TeXIcon,
  TextBackgroundDuotoneIcon,
  TextColorIcon,
  TextIcon,
  TodayIcon,
  TomorrowIcon,
  UnderLineIcon,
  UndoIcon,
  YesterdayIcon,
  YoutubeDuotoneIcon,
} from '@blocksuite/icons/lit';
import { cssVarV2 } from '@toeverything/theme/v2';

import type { PageRootBlockComponent } from '../../page/page-root-block.js';

import { getSurfaceBlock } from '../../../surface-ref-block/utils.js';
import { TOOL_PANEL_ICON_STYLE, TOOLBAR_ICON_STYLE } from './styles.js';

export type KeyboardToolbarConfig = {
  items: KeyboardToolbarItem[];
};

export type KeyboardToolbarItem =
  | KeyboardToolbarActionItem
  | KeyboardSubToolbarConfig
  | KeyboardToolPanelConfig;

export type KeyboardToolbarActionItem = {
  icon: TemplateResult;
  disable?: () => boolean;
  action?: (ctx: KeyboardToolbarContext) => void | Promise<void>;
};

export type KeyboardSubToolbarConfig = {
  icon: TemplateResult;
  items: KeyboardToolbarItem[];
};

export type KeyboardToolbarContext = {
  rootComponent: PageRootBlockComponent;
};

export type KeyboardToolPanelConfig = {
  icon: TemplateResult;
  activeIcon?: TemplateResult;
  activeBackground?: string;
  groups: (KeyboardToolPanelGroup | DynamicKeyboardToolPanelGroup)[];
};

export type KeyboardToolPanelGroup = {
  name: string;
  items: KeyboardToolPanelItem[];
};

export type DynamicKeyboardToolPanelGroup = (
  ctx: KeyboardToolbarContext
) => KeyboardToolPanelGroup | null;

export type KeyboardToolPanelItem = {
  name: string;
  icon: TemplateResult;
  disable?: (ctx: KeyboardToolbarContext) => boolean;
  action?: (ctx: KeyboardToolbarContext) => void | Promise<void>;
};

const basicToolGroup: KeyboardToolPanelGroup = {
  name: 'Basic',
  items: [
    {
      name: 'Text',
      icon: TextIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Heading1',
      icon: Heading1Icon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Heading2',
      icon: Heading2Icon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Heading3',
      icon: Heading3Icon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Heading4',
      icon: Heading4Icon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Heading5',
      icon: Heading5Icon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Heading6',
      icon: Heading6Icon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'CodeBlock',
      icon: CodeBlockIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Quote',
      icon: QuoteIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Divider',
      icon: DividerIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'TeX',
      icon: TeXIcon(TOOL_PANEL_ICON_STYLE),
    },
  ],
};

const listToolGroup: KeyboardToolPanelGroup = {
  name: 'List',
  items: [
    {
      name: 'BulletedList',
      icon: BulletedListIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'NumberedList',
      icon: NumberedListIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'CheckBox',
      icon: CheckBoxCheckLinearIcon(TOOL_PANEL_ICON_STYLE),
    },
  ],
};

const pageToolGroup: KeyboardToolPanelGroup = {
  name: 'Page',
  items: [
    {
      name: 'NewPage',
      icon: NewPageIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'LinkedPage',
      icon: LinkedPageIcon(TOOL_PANEL_ICON_STYLE),
    },
  ],
};

const contentMediaToolGroup: KeyboardToolPanelGroup = {
  name: 'Content & Media',
  items: [
    {
      name: 'Image',
      icon: NewPageIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Link',
      icon: LinkIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Attachment',
      icon: AttachmentIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Youtube',
      icon: YoutubeDuotoneIcon({
        ...TOOL_PANEL_ICON_STYLE,
        style: `color: white`,
      }),
    },
    {
      name: 'Github',
      icon: GithubIcon({ ...TOOL_PANEL_ICON_STYLE, style: `color: black` }),
    },
    {
      name: 'Figma',
      icon: FigmaDuotoneIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Loom',
      icon: LoomLogoIcon({ ...TOOL_PANEL_ICON_STYLE, style: `color: #625DF5` }),
    },
    {
      name: 'TeX',
      icon: TeXIcon(TOOL_PANEL_ICON_STYLE),
    },
  ],
};

const documentGroupFrameToolGroup: DynamicKeyboardToolPanelGroup = ({
  rootComponent,
}) => {
  const { doc } = rootComponent;

  const frameModels = doc
    .getBlocksByFlavour('affine:frame')
    .map(block => block.model) as FrameBlockModel[];

  const frameItems = frameModels.map<KeyboardToolPanelItem>(frameModel => ({
    name: 'Frame: ' + frameModel.title.toString(),
    icon: FrameIcon(TOOL_PANEL_ICON_STYLE),
  }));

  const surfaceModel = getSurfaceBlock(doc);

  const groupElements = surfaceModel
    ? surfaceModel.getElementsByType('group')
    : [];

  const groupItems = groupElements.map<KeyboardToolPanelItem>(group => ({
    name: 'Group: ' + group.title.toString(),
    icon: GroupIcon(TOOL_PANEL_ICON_STYLE),
  }));

  const items = [...frameItems, ...groupItems];

  if (items.length === 0) return null;

  return {
    name: 'Document Group&Frame',
    items,
  };
};

const dateToolGroup: KeyboardToolPanelGroup = {
  name: 'Date',
  items: [
    {
      name: 'Today',
      icon: TodayIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Tomorrow',
      icon: TomorrowIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Yesterday',
      icon: YesterdayIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Now',
      icon: NowIcon(TOOL_PANEL_ICON_STYLE),
    },
  ],
};

const databaseToolGroup: KeyboardToolPanelGroup = {
  name: 'Database',
  items: [
    {
      name: 'Table view',
      icon: DatabaseTableViewIcon(TOOL_PANEL_ICON_STYLE),
    },
    {
      name: 'Kanban view',
      icon: DatabaseKanbanViewIcon(TOOL_PANEL_ICON_STYLE),
    },
  ],
};

const moreToolPanel: KeyboardToolPanelConfig = {
  icon: PlusIcon(TOOLBAR_ICON_STYLE),
  activeIcon: CloseIcon({
    ...TOOLBAR_ICON_STYLE,
    style: `color: ${cssVarV2('icon/activated')}`,
  }),
  activeBackground: cssVarV2('edgeless/selection/selectionMarqueeBackground'),
  groups: [
    basicToolGroup,
    listToolGroup,
    pageToolGroup,
    contentMediaToolGroup,
    documentGroupFrameToolGroup,
    dateToolGroup,
    databaseToolGroup,
  ],
};

const textToolPanel: KeyboardToolPanelConfig = {
  icon: TextIcon(TOOLBAR_ICON_STYLE),
  groups: [
    {
      name: 'Turn into',
      items: [
        {
          name: 'Text',
          icon: TextIcon(TOOL_PANEL_ICON_STYLE),
        },
        {
          name: 'Heading1',
          icon: Heading1Icon(TOOL_PANEL_ICON_STYLE),
        },
        {
          name: 'Heading2',
          icon: Heading2Icon(TOOL_PANEL_ICON_STYLE),
        },
        {
          name: 'Heading3',
          icon: Heading3Icon(TOOL_PANEL_ICON_STYLE),
        },
        {
          name: 'Heading4',
          icon: Heading4Icon(TOOL_PANEL_ICON_STYLE),
        },
        {
          name: 'Heading5',
          icon: Heading5Icon(TOOL_PANEL_ICON_STYLE),
        },
        {
          name: 'Heading6',
          icon: Heading6Icon(TOOL_PANEL_ICON_STYLE),
        },
        {
          name: 'CodeBlock',
          icon: CodeBlockIcon(TOOL_PANEL_ICON_STYLE),
        },
        {
          name: 'Quote',
          icon: QuoteIcon(TOOL_PANEL_ICON_STYLE),
        },
        {
          name: 'Divider',
          icon: DividerIcon(TOOL_PANEL_ICON_STYLE),
        },
      ],
    },
  ],
};

const highlightToolPanel: KeyboardToolPanelConfig = {
  icon: HighLightDuotoneIcon(TOOLBAR_ICON_STYLE),
  groups: [
    {
      name: 'Color',
      items: [
        {
          name: 'Default Color',
          icon: TextColorIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/fg/orange')}`,
          }),
        },
        {
          name: 'Red',
          icon: TextColorIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/fg/red')}`,
          }),
        },
        {
          name: 'Orange',
          icon: TextColorIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/fg/orange')}`,
          }),
        },
        {
          name: 'Yellow',
          icon: TextColorIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/fg/yellow')}`,
          }),
        },
        {
          name: 'Green',
          icon: TextColorIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/fg/green')}`,
          }),
        },
        {
          name: 'Teal',
          icon: TextColorIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/fg/teal')}`,
          }),
        },
        {
          name: 'Blue',
          icon: TextColorIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/fg/blue')}`,
          }),
        },
        {
          name: 'Purple',
          icon: TextColorIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/fg/purple')}`,
          }),
        },
        {
          name: 'Grey',
          icon: TextColorIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/fg/grey')}`,
          }),
        },
      ],
    },
    {
      name: 'Background',
      items: [
        {
          name: 'Default Color',
          icon: TextBackgroundDuotoneIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/bg/orange')}`,
          }),
        },
        {
          name: 'Red',
          icon: TextBackgroundDuotoneIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/bg/red')}`,
          }),
        },
        {
          name: 'Orange',
          icon: TextBackgroundDuotoneIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/bg/orange')}`,
          }),
        },
        {
          name: 'Yellow',
          icon: TextBackgroundDuotoneIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/bg/yellow')}`,
          }),
        },
        {
          name: 'Green',
          icon: TextBackgroundDuotoneIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/bg/green')}`,
          }),
        },
        {
          name: 'Teal',
          icon: TextBackgroundDuotoneIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/bg/teal')}`,
          }),
        },
        {
          name: 'Blue',
          icon: TextBackgroundDuotoneIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/bg/blue')}`,
          }),
        },
        {
          name: 'Purple',
          icon: TextBackgroundDuotoneIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/bg/purple')}`,
          }),
        },
        {
          name: 'Grey',
          icon: TextBackgroundDuotoneIcon({
            ...TOOL_PANEL_ICON_STYLE,
            style: `color: ${cssVarV2('text/highlight/bg/grey')}`,
          }),
        },
      ],
    },
  ],
};

const textMenuToolbarConfig: KeyboardSubToolbarConfig = {
  icon: FontIcon(TOOLBAR_ICON_STYLE),
  items: [
    textToolPanel,
    { icon: BoldIcon(TOOLBAR_ICON_STYLE) },
    { icon: ItalicIcon(TOOLBAR_ICON_STYLE) },
    { icon: UnderLineIcon(TOOLBAR_ICON_STYLE) },
    { icon: StrikeThroughIcon(TOOLBAR_ICON_STYLE) },
    highlightToolPanel,
    { icon: CodeIcon(TOOLBAR_ICON_STYLE) },
    { icon: LinkIcon(TOOLBAR_ICON_STYLE) },
    { icon: TeXIcon(TOOLBAR_ICON_STYLE) },
  ],
};

export const defaultKeyboardToolbarConfig: KeyboardToolbarConfig = {
  items: [
    moreToolPanel,
    // TODO(@L-Sun): add ai function in AFFiNE side
    // { icon: AiIcon(iconStyle) },
    textMenuToolbarConfig,
    { icon: BulletedListIcon(TOOLBAR_ICON_STYLE) },
    { icon: NumberedListIcon(TOOLBAR_ICON_STYLE) },
    { icon: CheckBoxCheckLinearIcon(TOOLBAR_ICON_STYLE) },
    { icon: DividerIcon(TOOLBAR_ICON_STYLE) },
    { icon: UndoIcon(TOOLBAR_ICON_STYLE) },
    { icon: RedoIcon(TOOLBAR_ICON_STYLE) },
    // { icon: RightTabIcon({width:iconSize,height:iconSize}) },
    // { icon: CollapseTabIcon({width:iconSize,height:iconSize}) },
    { icon: CopyIcon(TOOLBAR_ICON_STYLE) },
    { icon: DuplicateIcon(TOOLBAR_ICON_STYLE) },
    { icon: BlockLinkIcon(TOOLBAR_ICON_STYLE) },
    { icon: DatabaseTableViewIcon(TOOLBAR_ICON_STYLE) },
    { icon: LinkedPageIcon(TOOLBAR_ICON_STYLE) },
    { icon: ArrowUpBigIcon(TOOLBAR_ICON_STYLE) },
    { icon: ArrowDownBigIcon(TOOLBAR_ICON_STYLE) },
    { icon: DeleteIcon(TOOLBAR_ICON_STYLE) },
  ],
};
