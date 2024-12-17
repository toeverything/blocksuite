import type { FrameBlockModel } from '@blocksuite/affine-model';
import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import {
  getInlineEditorByModel,
  insertContent,
  REFERENCE_NODE,
} from '@blocksuite/affine-components/rich-text';
import { toast } from '@blocksuite/affine-components/toast';
import {
  createDefaultDoc,
  openFileOrFiles,
} from '@blocksuite/affine-shared/utils';
import { viewPresets } from '@blocksuite/data-view/view-presets';
import { assertType } from '@blocksuite/global/utils';
import {
  AttachmentIcon,
  BoldIcon,
  BulletedListIcon,
  CheckBoxCheckLinearIcon,
  CloseIcon,
  CodeBlockIcon,
  CodeIcon,
  CollapseTabIcon,
  CopyIcon,
  DatabaseKanbanViewIcon,
  DatabaseTableViewIcon,
  DeleteIcon,
  DividerIcon,
  DuplicateIcon,
  FontIcon,
  FrameIcon,
  GithubIcon,
  GroupIcon,
  ImageIcon,
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
  RightTabIcon,
  StrikeThroughIcon,
  TeXIcon,
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
import type { AffineLinkedDocWidget } from '../linked-doc/index.js';

import { toggleEmbedCardCreateModal } from '../../../_common/components/embed-card/modal/embed-card-create-modal.js';
import { addSiblingAttachmentBlocks } from '../../../attachment-block/utils.js';
import { getSurfaceBlock } from '../../../surface-ref-block/utils.js';
import { formatDate, formatTime } from '../../utils/misc.js';
import {
  FigmaDuotoneIcon,
  HeadingIcon,
  HighLightDuotoneIcon,
  TextBackgroundDuotoneIcon,
  TextColorIcon,
} from './icons.js';

export type KeyboardToolbarConfig = {
  items: KeyboardToolbarItem[];
  /**
   * @description Whether to use the screen height as the keyboard height when the virtual keyboard API is not supported.
   * It is useful when the app is running in a webview and the keyboard is not overlaid on the content.
   * @default false
   */
  useScreenHeight?: boolean;
};

export type KeyboardToolbarItem =
  | KeyboardToolbarActionItem
  | KeyboardSubToolbarConfig
  | KeyboardToolPanelConfig;

export type KeyboardIconType =
  | TemplateResult
  | ((ctx: KeyboardToolbarContext) => TemplateResult);

export type KeyboardToolbarActionItem = {
  name: string;
  icon: KeyboardIconType;
  background?: string | ((ctx: KeyboardToolbarContext) => string | undefined);
  /**
   * @default true
   * @description Whether to show the item in the toolbar.
   */
  showWhen?: (ctx: KeyboardToolbarContext) => boolean;
  /**
   * @default false
   * @description Whether to set the item as disabled status.
   */
  disableWhen?: (ctx: KeyboardToolbarContext) => boolean;
  /**
   * @description The action to be executed when the item is clicked.
   */
  action?: (ctx: KeyboardToolbarContext) => void | Promise<void>;
};

export type KeyboardSubToolbarConfig = {
  icon: KeyboardIconType;
  items: KeyboardToolbarItem[];
};

export type KeyboardToolbarContext = {
  std: BlockStdScope;
  rootComponent: PageRootBlockComponent;
  /**
   * Close tool bar, and blur the focus if blur is true, default is false
   */
  closeToolbar: (blur?: boolean) => void;
  /**
   * Close current tool panel and show virtual keyboard
   */
  closeToolPanel: () => void;
};

export type KeyboardToolPanelConfig = {
  icon: KeyboardIconType;
  activeIcon?: KeyboardIconType;
  activeBackground?: string;
  groups: (KeyboardToolPanelGroup | DynamicKeyboardToolPanelGroup)[];
};

export type KeyboardToolPanelGroup = {
  name: string;
  items: KeyboardToolbarActionItem[];
};

export type DynamicKeyboardToolPanelGroup = (
  ctx: KeyboardToolbarContext
) => KeyboardToolPanelGroup | null;

const textToolActionItems: KeyboardToolbarActionItem[] = [
  {
    name: 'Text',
    icon: TextIcon(),
    showWhen: ({ std }) =>
      std.doc.schema.flavourSchemaMap.has('affine:paragraph'),
    action: ({ std }) => {
      std.command.exec('updateBlockType', {
        flavour: 'affine:paragraph',
        props: { type: 'text' },
      });
    },
  },
  ...([1, 2, 3, 4, 5, 6] as const).map(i => ({
    name: `Heading ${i}`,
    icon: HeadingIcon(i),
    showWhen: ({ std }: KeyboardToolbarContext) =>
      std.doc.schema.flavourSchemaMap.has('affine:paragraph'),
    action: ({ std }: KeyboardToolbarContext) => {
      std.command.exec('updateBlockType', {
        flavour: 'affine:paragraph',
        props: { type: `h${i}` },
      });
    },
  })),
  {
    name: 'CodeBlock',
    showWhen: ({ std }) => std.doc.schema.flavourSchemaMap.has('affine:code'),
    icon: CodeBlockIcon(),
    action: ({ std }) => {
      std.command.exec('updateBlockType', {
        flavour: 'affine:code',
      });
    },
  },
  {
    name: 'Quote',
    showWhen: ({ std }) =>
      std.doc.schema.flavourSchemaMap.has('affine:paragraph'),
    icon: QuoteIcon(),
    action: ({ std }) => {
      std.command.exec('updateBlockType', {
        flavour: 'affine:paragraph',
        props: { type: 'quote' },
      });
    },
  },
  {
    name: 'Divider',
    icon: DividerIcon(),
    showWhen: ({ std }) =>
      std.doc.schema.flavourSchemaMap.has('affine:divider'),
    action: ({ std }) => {
      std.command.exec('updateBlockType', {
        flavour: 'affine:divider',
        props: { type: 'divider' },
      });
    },
  },
  {
    name: 'Inline equation',
    icon: TeXIcon(),
    showWhen: ({ std }) =>
      std.doc.schema.flavourSchemaMap.has('affine:paragraph'),
    action: ({ std }) => {
      std.command.chain().getTextSelection().insertInlineLatex().run();
    },
  },
];

const listToolActionItems: KeyboardToolbarActionItem[] = [
  {
    name: 'BulletedList',
    icon: BulletedListIcon(),
    showWhen: ({ std }) => std.doc.schema.flavourSchemaMap.has('affine:list'),
    action: ({ std }) => {
      std.command.exec('updateBlockType', {
        flavour: 'affine:list',
        props: {
          type: 'bulleted',
        },
      });
    },
  },
  {
    name: 'NumberedList',
    icon: NumberedListIcon(),
    showWhen: ({ std }) => std.doc.schema.flavourSchemaMap.has('affine:list'),
    action: ({ std }) => {
      std.command.exec('updateBlockType', {
        flavour: 'affine:list',
        props: {
          type: 'numbered',
        },
      });
    },
  },
  {
    name: 'CheckBox',
    icon: CheckBoxCheckLinearIcon(),
    showWhen: ({ std }) => std.doc.schema.flavourSchemaMap.has('affine:list'),
    action: ({ std }) => {
      std.command.exec('updateBlockType', {
        flavour: 'affine:list',
        props: {
          type: 'todo',
        },
      });
    },
  },
];

const pageToolGroup: KeyboardToolPanelGroup = {
  name: 'Page',
  items: [
    {
      name: 'NewPage',
      icon: NewPageIcon(),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:embed-linked-doc'),
      action: ({ std }) => {
        std.command
          .chain()
          .getSelectedModels()
          .inline(({ selectedModels }) => {
            const newDoc = createDefaultDoc(std.doc.collection);
            if (!selectedModels?.length) return;
            insertContent(std.host, selectedModels[0], REFERENCE_NODE, {
              reference: {
                type: 'LinkedPage',
                pageId: newDoc.id,
              },
            });
          })
          .run();
      },
    },
    {
      name: 'LinkedPage',
      icon: LinkedPageIcon(),
      showWhen: ({ std, rootComponent }) => {
        const linkedDocWidget = std.view.getWidget(
          'affine-linked-doc-widget',
          rootComponent.model.id
        );
        if (!linkedDocWidget) return false;

        return std.doc.schema.flavourSchemaMap.has('affine:embed-linked-doc');
      },
      action: ({ rootComponent, closeToolbar }) => {
        const { std } = rootComponent;

        const linkedDocWidget = std.view.getWidget(
          'affine-linked-doc-widget',
          rootComponent.model.id
        );
        if (!linkedDocWidget) return;
        assertType<AffineLinkedDocWidget>(linkedDocWidget);

        const triggerKey = linkedDocWidget.config.triggerKeys[0];

        std.command
          .chain()
          .getSelectedModels()
          .inline(ctx => {
            const { selectedModels } = ctx;
            if (!selectedModels?.length) return;

            const currentModel = selectedModels[0];
            insertContent(std.host, currentModel, triggerKey);

            const inlineEditor = getInlineEditorByModel(std.host, currentModel);
            // Wait for range to be updated
            inlineEditor?.slots.inlineRangeSync.once(() => {
              linkedDocWidget.show('mobile');
              closeToolbar();
            });
          })
          .run();
      },
    },
  ],
};

const contentMediaToolGroup: KeyboardToolPanelGroup = {
  name: 'Content & Media',
  items: [
    {
      name: 'Image',
      icon: ImageIcon(),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:image'),
      action: ({ std }) => {
        std.command
          .chain()
          .getSelectedModels()
          .insertImages({ removeEmptyLine: true })
          .run();
      },
    },
    {
      name: 'Link',
      icon: LinkIcon(),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:bookmark'),
      action: async ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.doc.getParent(model);
        if (!parentModel) return;

        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'Links',
          'The added link will be displayed as a card view.',
          { mode: 'page', parentModel, index }
        );
        if (model.text?.length === 0) {
          std.doc.deleteBlock(model);
        }
      },
    },
    {
      name: 'Attachment',
      icon: AttachmentIcon(),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:attachment'),
      action: async ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        const file = await openFileOrFiles();
        if (!file) return;

        const attachmentService = std.getService('affine:attachment');
        if (!attachmentService) return;
        const maxFileSize = attachmentService.maxFileSize;

        await addSiblingAttachmentBlocks(std.host, [file], maxFileSize, model);
        if (model.text?.length === 0) {
          std.doc.deleteBlock(model);
        }
      },
    },
    {
      name: 'Youtube',
      icon: YoutubeDuotoneIcon({
        style: `color: white`,
      }),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:embed-youtube'),
      action: async ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.doc.getParent(model);
        if (!parentModel) return;

        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'YouTube',
          'The added YouTube video link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        if (model.text?.length === 0) {
          std.doc.deleteBlock(model);
        }
      },
    },
    {
      name: 'Github',
      icon: GithubIcon({ style: `color: black` }),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:embed-github'),
      action: async ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.doc.getParent(model);
        if (!parentModel) return;

        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'GitHub',
          'The added GitHub issue or pull request link will be displayed as a card view.',
          { mode: 'page', parentModel, index }
        );
        if (model.text?.length === 0) {
          std.doc.deleteBlock(model);
        }
      },
    },
    {
      name: 'Figma',
      icon: FigmaDuotoneIcon,
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:embed-figma'),
      action: async ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'Figma',
          'The added Figma link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        if (model.text?.length === 0) {
          std.doc.deleteBlock(model);
        }
      },
    },
    {
      name: 'Loom',
      icon: LoomLogoIcon({ style: `color: #625DF5` }),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:embed-loom'),
      action: async ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        const parentModel = std.doc.getParent(model);
        if (!parentModel) return;

        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          std.host,
          'Loom',
          'The added Loom video link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        if (model.text?.length === 0) {
          std.doc.deleteBlock(model);
        }
      },
    },
    {
      name: 'Equation',
      icon: TeXIcon(),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:latex'),
      action: ({ std }) => {
        std.command
          .chain()
          .getSelectedModels()
          .insertLatexBlock({
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    },
  ],
};

const documentGroupFrameToolGroup: DynamicKeyboardToolPanelGroup = ({
  std,
}) => {
  const { doc } = std;

  const frameModels = doc
    .getBlocksByFlavour('affine:frame')
    .map(block => block.model) as FrameBlockModel[];

  const frameItems = frameModels.map<KeyboardToolbarActionItem>(frameModel => ({
    name: 'Frame: ' + frameModel.title.toString(),
    icon: FrameIcon(),
    action: ({ std }) => {
      std.command
        .chain()
        .getSelectedModels()
        .insertSurfaceRefBlock({
          reference: frameModel.id,
          place: 'after',
          removeEmptyLine: true,
        })
        .run();
    },
  }));

  const surfaceModel = getSurfaceBlock(doc);

  const groupElements = surfaceModel
    ? surfaceModel.getElementsByType('group')
    : [];

  const groupItems = groupElements.map<KeyboardToolbarActionItem>(group => ({
    name: 'Group: ' + group.title.toString(),
    icon: GroupIcon(),
    action: ({ std }) => {
      std.command
        .chain()
        .getSelectedModels()
        .insertSurfaceRefBlock({
          reference: group.id,
          place: 'after',
          removeEmptyLine: true,
        })
        .run();
    },
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
      icon: TodayIcon(),
      action: ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        insertContent(std.host, model, formatDate(new Date()));
      },
    },
    {
      name: 'Tomorrow',
      icon: TomorrowIcon(),
      action: ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        insertContent(std.host, model, formatDate(tomorrow));
      },
    },
    {
      name: 'Yesterday',
      icon: YesterdayIcon(),
      action: ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        insertContent(std.host, model, formatDate(yesterday));
      },
    },
    {
      name: 'Now',
      icon: NowIcon(),
      action: ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        insertContent(std.host, model, formatTime(new Date()));
      },
    },
  ],
};

const databaseToolGroup: KeyboardToolPanelGroup = {
  name: 'Database',
  items: [
    {
      name: 'Table view',
      icon: DatabaseTableViewIcon(),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:database'),
      action: ({ std }) => {
        std.command
          .chain()
          .getSelectedModels()
          .insertDatabaseBlock({
            viewType: viewPresets.tableViewMeta.type,
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    },
    {
      name: 'Kanban view',
      icon: DatabaseKanbanViewIcon(),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:database'),
      action: ({ std }) => {
        std.command
          .chain()
          .getSelectedModels()
          .insertDatabaseBlock({
            viewType: viewPresets.kanbanViewMeta.type,
            place: 'after',
            removeEmptyLine: true,
          })
          .run();
      },
    },
  ],
};

const moreToolPanel: KeyboardToolPanelConfig = {
  icon: PlusIcon(),
  activeIcon: CloseIcon({
    style: `color: ${cssVarV2('icon/activated')}`,
  }),
  activeBackground: cssVarV2('edgeless/selection/selectionMarqueeBackground'),
  groups: [
    { name: 'Basic', items: textToolActionItems },
    { name: 'List', items: listToolActionItems },
    pageToolGroup,
    contentMediaToolGroup,
    documentGroupFrameToolGroup,
    dateToolGroup,
    databaseToolGroup,
  ],
};

const textToolPanel: KeyboardToolPanelConfig = {
  icon: TextIcon(),
  groups: [
    {
      name: 'Turn into',
      items: textToolActionItems,
    },
  ],
};

const textStyleToolItems: KeyboardToolbarItem[] = [
  {
    name: 'Bold',
    icon: BoldIcon(),
    background: ({ std }) => {
      const { textStyle } = std.command.exec('getTextStyle');
      return textStyle?.bold ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec('toggleBold');
    },
  },
  {
    name: 'Italic',
    icon: ItalicIcon(),
    background: ({ std }) => {
      const { textStyle } = std.command.exec('getTextStyle');
      return textStyle?.italic ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec('toggleItalic');
    },
  },
  {
    name: 'UnderLine',
    icon: UnderLineIcon(),
    background: ({ std }) => {
      const { textStyle } = std.command.exec('getTextStyle');
      return textStyle?.underline ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec('toggleUnderline');
    },
  },
  {
    name: 'StrikeThrough',
    icon: StrikeThroughIcon(),
    background: ({ std }) => {
      const { textStyle } = std.command.exec('getTextStyle');
      return textStyle?.strike ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec('toggleStrike');
    },
  },
  {
    name: 'Code',
    icon: CodeIcon(),
    background: ({ std }) => {
      const { textStyle } = std.command.exec('getTextStyle');
      return textStyle?.code ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec('toggleCode');
    },
  },
  {
    name: 'Link',
    icon: LinkIcon(),
    background: ({ std }) => {
      const { textStyle } = std.command.exec('getTextStyle');
      return textStyle?.link ? '#00000012' : '';
    },
    action: ({ std }) => {
      std.command.exec('toggleLink');
    },
  },
];

const highlightToolPanel: KeyboardToolPanelConfig = {
  icon: ({ std }) => {
    const { textStyle } = std.command.exec('getTextStyle');
    if (textStyle?.color) {
      return HighLightDuotoneIcon(textStyle.color);
    } else {
      return HighLightDuotoneIcon(cssVarV2('icon/primary'));
    }
  },
  groups: [
    {
      name: 'Color',
      items: [
        {
          name: 'Default Color',
          icon: TextColorIcon(cssVarV2('text/highlight/fg/orange')),
        },
        ...(
          [
            'red',
            'orange',
            'yellow',
            'green',
            'teal',
            'blue',
            'purple',
            'grey',
          ] as const
        ).map<KeyboardToolbarActionItem>(color => ({
          name: color.charAt(0).toUpperCase() + color.slice(1),
          icon: TextColorIcon(cssVarV2(`text/highlight/fg/${color}`)),
          action: ({ std }) => {
            const payload = {
              styles: {
                color: cssVarV2(`text/highlight/fg/${color}`),
              } satisfies AffineTextAttributes,
            };
            std.command
              .chain()
              .try(chain => [
                chain.getTextSelection().formatText(payload),
                chain.getBlockSelections().formatBlock(payload),
                chain.formatNative(payload),
              ])
              .run();
          },
        })),
      ],
    },
    {
      name: 'Background',
      items: [
        {
          name: 'Default Color',
          icon: TextBackgroundDuotoneIcon(cssVarV2('text/highlight/bg/orange')),
        },
        ...(
          [
            'red',
            'orange',
            'yellow',
            'green',
            'teal',
            'blue',
            'purple',
            'grey',
          ] as const
        ).map<KeyboardToolbarActionItem>(color => ({
          name: color.charAt(0).toUpperCase() + color.slice(1),
          icon: TextBackgroundDuotoneIcon(
            cssVarV2(`text/highlight/bg/${color}`)
          ),
          action: ({ std }) => {
            const payload = {
              styles: {
                background: cssVarV2(`text/highlight/bg/${color}`),
              } satisfies AffineTextAttributes,
            };
            std.command
              .chain()
              .try(chain => [
                chain.getTextSelection().formatText(payload),
                chain.getBlockSelections().formatBlock(payload),
                chain.formatNative(payload),
              ])
              .run();
          },
        })),
      ],
    },
  ],
};

const textSubToolbarConfig: KeyboardSubToolbarConfig = {
  icon: FontIcon(),
  items: [
    textToolPanel,
    ...textStyleToolItems,
    {
      name: 'InlineTex',
      icon: TeXIcon(),
      action: ({ std }) => {
        std.command.chain().getTextSelection().insertInlineLatex().run();
      },
    },
    highlightToolPanel,
  ],
};

export const defaultKeyboardToolbarConfig: KeyboardToolbarConfig = {
  items: [
    moreToolPanel,
    // TODO(@L-Sun): add ai function in AFFiNE side
    // { icon: AiIcon(iconStyle) },
    textSubToolbarConfig,
    {
      name: 'Image',
      icon: ImageIcon(),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:image'),
      action: ({ std }) => {
        std.command
          .chain()
          .getSelectedModels()
          .insertImages({ removeEmptyLine: true })
          .run();
      },
    },
    {
      name: 'Attachment',
      icon: AttachmentIcon(),
      showWhen: ({ std }) =>
        std.doc.schema.flavourSchemaMap.has('affine:attachment'),
      action: async ({ std }) => {
        const { selectedModels } = std.command.exec('getSelectedModels');
        const model = selectedModels?.[0];
        if (!model) return;

        const file = await openFileOrFiles();
        if (!file) return;

        const attachmentService = std.getService('affine:attachment');
        if (!attachmentService) return;
        const maxFileSize = attachmentService.maxFileSize;

        await addSiblingAttachmentBlocks(std.host, [file], maxFileSize, model);
        if (model.text?.length === 0) {
          std.doc.deleteBlock(model);
        }
      },
    },
    {
      name: 'Undo',
      icon: UndoIcon(),
      disableWhen: ({ std }) => !std.doc.canUndo,
      action: ({ std }) => {
        std.doc.undo();
      },
    },
    {
      name: 'Redo',
      icon: RedoIcon(),
      disableWhen: ({ std }) => !std.doc.canRedo,
      action: ({ std }) => {
        std.doc.redo();
      },
    },
    {
      name: 'RightTab',
      icon: RightTabIcon(),
      disableWhen: ({ std }) => {
        const [success] = std.command
          .chain()
          .tryAll(chain => [chain.canIndentParagraph(), chain.canIndentList()])
          .run();
        return !success;
      },
      action: ({ std }) => {
        std.command
          .chain()
          .tryAll(chain => [
            chain.canIndentParagraph().indentParagraph(),
            chain.canIndentList().indentList(),
          ])
          .run();
      },
    },
    ...listToolActionItems,
    ...textToolActionItems.filter(({ name }) => name === 'Divider'),
    {
      name: 'CollapseTab',
      icon: CollapseTabIcon(),
      disableWhen: ({ std }) => {
        const [success] = std.command
          .chain()
          .tryAll(chain => [chain.canDedentParagraph(), chain.canDedentList()])
          .run();
        return !success;
      },
      action: ({ std }) => {
        std.command
          .chain()
          .tryAll(chain => [
            chain.canDedentParagraph().dedentParagraph(),
            chain.canDedentList().dedentList(),
          ])
          .run();
      },
    },
    {
      name: 'Copy',
      icon: CopyIcon(),
      action: ({ std }) => {
        std.command
          .chain()
          .getSelectedModels()
          .with({
            onCopy: () => {
              toast(std.host, 'Copied to clipboard');
            },
          })
          .draftSelectedModels()
          .copySelectedModels()
          .run();
      },
    },
    {
      name: 'Duplicate',
      icon: DuplicateIcon(),
      action: ({ std }) => {
        std.command
          .chain()
          .getSelectedModels()
          .draftSelectedModels()
          .duplicateSelectedModels()
          .run();
      },
    },
    {
      name: 'Delete',
      icon: DeleteIcon(),
      action: ({ std }) => {
        std.command.chain().getSelectedModels().deleteSelectedModels().run();
      },
    },
  ],
  useScreenHeight: false,
};
