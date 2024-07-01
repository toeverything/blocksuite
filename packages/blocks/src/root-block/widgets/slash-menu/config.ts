import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import { Slice, Text } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { toggleEmbedCardCreateModal } from '../../../_common/components/embed-card/modal/embed-card-create-modal.js';
import { toast } from '../../../_common/components/toast.js';
import { textConversionConfigs } from '../../../_common/configs/text-conversion.js';
import { textFormatConfigs } from '../../../_common/configs/text-format/config.js';
import {
  ArrowDownBigIcon,
  ArrowUpBigIcon,
  CopyIcon,
  DatabaseKanbanViewIcon20,
  DatabaseTableViewIcon20,
  DeleteIcon,
  FileIcon,
  FrameIcon,
  HeadingIcon,
  ImageIcon20,
  LinkedDocIcon,
  LinkIcon,
  NewDocIcon,
  NowIcon,
  PasteIcon,
  TodayIcon,
  TomorrowIcon,
  YesterdayIcon,
} from '../../../_common/icons/index.js';
import { REFERENCE_NODE } from '../../../_common/inline/presets/nodes/consts.js';
import {
  createDefaultDoc,
  getBlockComponentByPath,
  getImageFilesFromLocal,
  getInlineEditorByModel,
  matchFlavours,
  openFileOrFiles,
} from '../../../_common/utils/index.js';
import { clearMarksOnDiscontinuousInput } from '../../../_common/utils/inline-editor.js';
import { addSiblingAttachmentBlocks } from '../../../attachment-block/utils.js';
import type { DataViewBlockComponent } from '../../../data-view-block/index.js';
import { GroupingIcon } from '../../../database-block/data-view/common/icons/index.js';
import { viewPresets } from '../../../database-block/data-view/index.js';
import { FigmaIcon } from '../../../embed-figma-block/styles.js';
import { GithubIcon } from '../../../embed-github-block/styles.js';
import { LoomIcon } from '../../../embed-loom-block/styles.js';
import { YoutubeIcon } from '../../../embed-youtube-block/styles.js';
import type { FrameBlockModel } from '../../../frame-block/frame-model.js';
import { addSiblingImageBlock } from '../../../image-block/utils.js';
import { NoteBlockModel } from '../../../note-block/note-model.js';
import type { ParagraphBlockModel } from '../../../paragraph-block/index.js';
import { onModelTextUpdated } from '../../../root-block/utils/index.js';
import { CanvasElementType } from '../../../surface-block/index.js';
import { getSurfaceBlock } from '../../../surface-ref-block/utils.js';
import type { RootBlockComponent } from '../../types.js';
import type { AffineLinkedDocWidget } from '../linked-doc/index.js';
import { type SlashMenuTooltip, slashMenuToolTips } from './tooltips/index.js';
import {
  createDatabaseBlockInNextLine,
  formatDate,
  formatTime,
  insertContent,
  insideDatabase,
  insideEdgelessText,
  tryRemoveEmptyLine,
} from './utils.js';
import { createConversionItem } from './utils.js';

export type SlashMenuConfig = {
  triggerKeys: string[];
  ignoreBlockTypes: BlockSuite.Flavour[];
  items: SlashMenuItem[];
  maxHeight: number;
  tooltipTimeout: number;
};

export type SlashMenuStaticConfig = Omit<SlashMenuConfig, 'items'> & {
  items: SlashMenuStaticItem[];
};

export type SlashMenuItem = SlashMenuStaticItem | SlashMenuItemGenerator;

export type SlashMenuStaticItem =
  | SlashMenuGroupDivider
  | SlashMenuActionItem
  | SlashSubMenu;

export type SlashMenuGroupDivider = {
  groupName: string;
  showWhen?: (ctx: SlashMenuContext) => boolean;
};

export type SlashMenuActionItem = {
  name: string;
  description?: string;
  icon?: TemplateResult;
  tooltip?: SlashMenuTooltip;
  alias?: string[];
  showWhen?: (ctx: SlashMenuContext) => boolean;
  action: (ctx: SlashMenuContext) => void | Promise<void>;

  customTemplate?: TemplateResult<1>;
};

export type SlashSubMenu = {
  name: string;
  description?: string;
  icon?: TemplateResult;
  alias?: string[];
  showWhen?: (ctx: SlashMenuContext) => boolean;
  subMenu: SlashMenuStaticItem[];
};

export type SlashMenuItemGenerator = (
  ctx: SlashMenuContext
) => (SlashMenuGroupDivider | SlashMenuActionItem | SlashSubMenu)[];

export type SlashMenuContext = {
  rootElement: RootBlockComponent;
  model: BlockModel;
};

export const defaultSlashMenuConfig: SlashMenuConfig = {
  triggerKeys: ['/', '、'],
  ignoreBlockTypes: ['affine:code'],
  maxHeight: 344,
  tooltipTimeout: 800,
  items: [
    // ---------------------------------------------------------
    { groupName: 'Basic' },
    ...textConversionConfigs
      .filter(i => i.type && ['text', 'h1', 'h2', 'h3'].includes(i.type))
      .map(createConversionItem),
    {
      name: 'Other Headings',
      icon: HeadingIcon,
      subMenu: [
        { groupName: 'Headings' },
        ...textConversionConfigs
          .filter(i => i.type && ['h4', 'h5', 'h6'].includes(i.type))
          .map<SlashMenuActionItem>(createConversionItem),
      ],
    },
    ...textConversionConfigs
      .filter(i => i.flavour === 'affine:code')
      .map<SlashMenuActionItem>(config => ({
        ...createConversionItem(config),
        showWhen: ({ model }) =>
          model.doc.schema.flavourSchemaMap.has(config.flavour) &&
          !insideDatabase(model),
        action: ({ rootElement }) => {
          const { flavour, type } = config;
          rootElement.host.std.command
            .chain()
            .updateBlockType({
              flavour,
              props: { type },
            })
            .inline((ctx, next) => {
              const newModels = ctx.updatedBlocks;
              if (!newModels) return false;

              // Reset selection if the target is code block
              if (flavour === 'affine:code') {
                if (newModels.length !== 1) {
                  console.error(
                    "Failed to reset selection! New model length isn't 1"
                  );
                  return false;
                }
                const codeModel = newModels[0];
                onModelTextUpdated(rootElement.host, codeModel, richText => {
                  const inlineEditor = richText.inlineEditor;
                  assertExists(inlineEditor);
                  inlineEditor.focusEnd();
                }).catch(console.error);
              }

              return next();
            })
            .run();
        },
      })),

    ...textConversionConfigs
      .filter(i => i.type && ['quote', 'divider'].includes(i.type))
      .map<SlashMenuActionItem>(config => ({
        ...createConversionItem(config),
        showWhen: ({ model }) =>
          model.doc.schema.flavourSchemaMap.has(config.flavour) &&
          !insideDatabase(model) &&
          !insideEdgelessText(model),
      })),

    // ---------------------------------------------------------
    { groupName: 'List' },
    ...textConversionConfigs
      .filter(i => i.flavour === 'affine:list')
      .map(createConversionItem),

    // ---------------------------------------------------------
    { groupName: 'Style' },
    ...textFormatConfigs
      .filter(i => !['Link', 'Code'].includes(i.name))
      .map<SlashMenuActionItem>(({ name, icon, id }) => ({
        name,
        icon,
        tooltip: slashMenuToolTips[name],
        action: ({ rootElement, model }) => {
          if (!model.text) {
            return;
          }
          const len = model.text.length;
          if (!len) {
            const inlineEditor = getInlineEditorByModel(
              rootElement.host,
              model
            );
            assertExists(
              inlineEditor,
              "Can't set style mark! Inline editor not found"
            );
            inlineEditor.setMarks({
              [id]: true,
            });
            clearMarksOnDiscontinuousInput(inlineEditor);
            return;
          }
          model.text.format(0, len, {
            [id]: true,
          });
        },
      })),

    // ---------------------------------------------------------
    { groupName: 'Page' },
    {
      name: 'New Doc',
      description: 'Start a new document.',
      icon: NewDocIcon,
      tooltip: slashMenuToolTips['New Doc'],
      action: ({ rootElement, model }) => {
        const newDoc = createDefaultDoc(rootElement.doc.collection);
        insertContent(rootElement.host, model, REFERENCE_NODE, {
          reference: {
            type: 'LinkedPage',
            pageId: newDoc.id,
          },
        });
      },
    },
    {
      name: 'Linked Doc',
      description: 'Link to another document.',
      icon: LinkedDocIcon,
      tooltip: slashMenuToolTips['Linked Doc'],
      alias: ['dual link'],
      showWhen: ({ rootElement }) => {
        const linkedDocWidgetEle =
          rootElement.widgetElements['affine-linked-doc-widget'];
        if (!linkedDocWidgetEle) return false;
        if (!('showLinkedDoc' in linkedDocWidgetEle)) {
          console.warn(
            'You may not have correctly implemented the linkedDoc widget! "showLinkedDoc(model)" method not found on widget'
          );
          return false;
        }
        return true;
      },
      action: ({ model, rootElement }) => {
        const triggerKey = '@';
        insertContent(rootElement.host, model, triggerKey);
        assertExists(model.doc.root);
        const widgetEle =
          rootElement.widgetElements['affine-linked-doc-widget'];
        assertExists(widgetEle);
        // We have checked the existence of showLinkedDoc method in the showWhen
        const linkedDocWidget = widgetEle as AffineLinkedDocWidget;
        // Wait for range to be updated
        setTimeout(() => {
          const inlineEditor = getInlineEditorByModel(rootElement.host, model);
          assertExists(inlineEditor);
          linkedDocWidget.showLinkedDoc(inlineEditor, triggerKey);
        });
      },
    },

    // ---------------------------------------------------------
    { groupName: 'Content & Media' },
    {
      name: 'Image',
      description: 'Insert an image.',
      icon: ImageIcon20,
      tooltip: slashMenuToolTips['Image'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:image') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parent = rootElement.doc.getParent(model);
        if (!parent) {
          return;
        }

        const imageFiles = await getImageFilesFromLocal();
        if (!imageFiles.length) return;

        const imageService = rootElement.host.spec.getService('affine:image');
        const maxFileSize = imageService.maxFileSize;

        addSiblingImageBlock(rootElement.host, imageFiles, maxFileSize, model);
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Link',
      description: 'Add a bookmark for reference.',
      icon: LinkIcon,
      tooltip: slashMenuToolTips['Link'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:bookmark') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'Links',
          'The added link will be displayed as a card view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Attachment',
      description: 'Attach a file to document.',
      icon: FileIcon,
      tooltip: slashMenuToolTips['Attachment'],
      alias: ['file'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:attachment') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const file = await openFileOrFiles();
        if (!file) return;

        const attachmentService =
          rootElement.host.spec.getService('affine:attachment');
        assertExists(attachmentService);
        const maxFileSize = attachmentService.maxFileSize;

        await addSiblingAttachmentBlocks(
          rootElement.host,
          [file],
          maxFileSize,
          model
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'YouTube',
      description: 'Embed a YouTube video.',
      icon: YoutubeIcon,
      tooltip: slashMenuToolTips['YouTube'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-youtube') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'YouTube',
          'The added YouTube video link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'GitHub',
      description: 'Link to a GitHub repository.',
      icon: GithubIcon,
      tooltip: slashMenuToolTips['Github'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-github') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'GitHub',
          'The added GitHub issue or pull request link will be displayed as a card view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },
    // TODO: X Twitter

    {
      name: 'Figma',
      description: 'Embed a Figma document.',
      icon: FigmaIcon,
      tooltip: slashMenuToolTips['Figma'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-figma') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'Figma',
          'The added Figma link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },

    {
      name: 'Loom',
      icon: LoomIcon,
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-loom') &&
        !insideDatabase(model),
      action: async ({ rootElement, model }) => {
        const parentModel = rootElement.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootElement.host,
          'Loom',
          'The added Loom video link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },

    // TODO-slash: Linear

    // TODO-slash: Group & Frame explorer

    // ---------------------------------------------------------
    ({ model, rootElement }) => {
      const { doc } = rootElement;

      const surfaceModel = getSurfaceBlock(doc);
      const noteModel = doc.getParent(model);
      if (!(noteModel instanceof NoteBlockModel)) return [];

      if (!surfaceModel) return [];

      const frameModels = doc
        .getBlocksByFlavour('affine:frame')
        .map(block => block.model) as FrameBlockModel[];

      const frameItems = frameModels.map<SlashMenuActionItem>(frameModel => ({
        name: 'Frame: ' + frameModel.title,
        icon: FrameIcon,
        showWhen: () => !insideDatabase(model),
        action: () => {
          const insertIdx = noteModel.children.indexOf(model);
          const surfaceRefProps = {
            flavour: 'affine:surface-ref',
            reference: frameModel.id,
            refFlavour: 'affine:frame',
          };

          doc.addSiblingBlocks(
            model,
            [surfaceRefProps],
            insertIdx === 0 ? 'before' : 'after'
          );

          if (
            matchFlavours(model, ['affine:paragraph']) &&
            model.text.length === 0
          ) {
            doc.deleteBlock(model);
          }
        },
      }));

      const groupElements = Array.from(
        surfaceModel.elements.getValue()?.values() ?? []
      ).filter(element => element.get('type') === CanvasElementType.GROUP);

      const groupItems = groupElements.map(element => ({
        name: 'Group: ' + element.get('title'),
        icon: GroupingIcon,
        action: () => {
          const { doc } = rootElement;
          const noteModel = doc.getParent(model) as NoteBlockModel;
          const insertIdx = noteModel.children.indexOf(model);
          const surfaceRefProps = {
            flavour: 'affine:surface-ref',
            reference: element.get('id'),
            refFlavour: 'group',
          };

          doc.addSiblingBlocks(
            model,
            [surfaceRefProps],
            insertIdx === 0 ? 'before' : 'after'
          );

          if (
            matchFlavours(model, ['affine:paragraph']) &&
            model.text.length === 0
          ) {
            doc.deleteBlock(model);
          }
        },
      }));

      const items = [...frameItems, ...groupItems];
      if (items.length !== 0) {
        return [
          {
            groupName: 'Document Group & Frame',
          },
          ...items,
        ];
      } else {
        return [];
      }
    },

    // ---------------------------------------------------------
    { groupName: 'Date' },
    () => {
      const now = new Date();
      const tomorrow = new Date();
      const yesterday = new Date();

      yesterday.setDate(yesterday.getDate() - 1);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return [
        {
          name: 'Today',
          icon: TodayIcon,
          tooltip: slashMenuToolTips['Today'],
          description: formatDate(now),
          action: ({ rootElement, model }) => {
            insertContent(rootElement.host, model, formatDate(now));
          },
        },
        {
          name: 'Tomorrow',
          icon: TomorrowIcon,
          tooltip: slashMenuToolTips['Tomorrow'],
          description: formatDate(tomorrow),
          action: ({ rootElement, model }) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            insertContent(rootElement.host, model, formatDate(tomorrow));
          },
        },
        {
          name: 'Yesterday',
          icon: YesterdayIcon,
          tooltip: slashMenuToolTips['Yesterday'],
          description: formatDate(yesterday),
          action: ({ rootElement, model }) => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            insertContent(rootElement.host, model, formatDate(yesterday));
          },
        },
        {
          name: 'Now',
          icon: NowIcon,
          tooltip: slashMenuToolTips['Now'],
          description: formatTime(now),
          action: ({ rootElement, model }) => {
            insertContent(rootElement.host, model, formatTime(now));
          },
        },
      ];
    },

    // ---------------------------------------------------------
    { groupName: 'Database' },
    {
      name: 'Table View',
      description: 'Display items in a table format.',
      alias: ['database'],
      icon: DatabaseTableViewIcon20,
      tooltip: slashMenuToolTips['Table View'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:database') &&
        !insideDatabase(model) &&
        !insideEdgelessText(model),
      action: ({ rootElement, model }) => {
        const id = createDatabaseBlockInNextLine(model);
        if (!id) {
          return;
        }
        const service = rootElement.std.spec.getService('affine:database');
        service.initDatabaseBlock(
          rootElement.doc,
          model,
          id,
          viewPresets.tableViewConfig,
          false
        );
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Todo',
      alias: ['todo view'],
      icon: DatabaseTableViewIcon20,
      tooltip: slashMenuToolTips['Todo'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:database') &&
        !insideDatabase(model) &&
        !insideEdgelessText(model) &&
        !!model.doc.awarenessStore.getFlag('enable_block_query'),

      action: ({ model, rootElement }) => {
        const parent = rootElement.doc.getParent(model);
        assertExists(parent);
        const index = parent.children.indexOf(model);
        const id = rootElement.doc.addBlock(
          'affine:data-view',
          {},
          rootElement.doc.getParent(model),
          index + 1
        );
        const dataViewModel = rootElement.doc.getBlock(id)!;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        Promise.resolve().then(() => {
          const dataView = getBlockComponentByPath(
            rootElement.host,
            dataViewModel.model.id
          ) as DataViewBlockComponent;
          dataView.viewSource.viewAdd('table');
        });
        tryRemoveEmptyLine(model);
      },
    },
    {
      name: 'Kanban View',
      description: 'Visualize data in a dashboard.',
      alias: ['database'],
      icon: DatabaseKanbanViewIcon20,
      tooltip: slashMenuToolTips['Kanban View'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:database') &&
        !insideDatabase(model) &&
        !insideEdgelessText(model),
      action: ({ model, rootElement }) => {
        const id = createDatabaseBlockInNextLine(model);
        if (!id) {
          return;
        }
        const service = rootElement.std.spec.getService('affine:database');
        service.initDatabaseBlock(
          rootElement.doc,
          model,
          id,
          viewPresets.kanbanViewConfig,
          false
        );
        tryRemoveEmptyLine(model);
      },
    },

    // ---------------------------------------------------------
    { groupName: 'Actions' },
    {
      name: 'Move Up',
      description: 'Shift this line up.',
      icon: ArrowUpBigIcon,
      tooltip: slashMenuToolTips['Move Up'],
      action: ({ rootElement, model }) => {
        const doc = rootElement.doc;
        const previousSiblingModel = doc.getPrev(model);
        if (!previousSiblingModel) return;

        const parentModel = doc.getParent(previousSiblingModel);
        if (!parentModel) return;

        doc.moveBlocks([model], parentModel, previousSiblingModel, true);
      },
    },
    {
      name: 'Move Down',
      description: 'Shift this line down.',
      icon: ArrowDownBigIcon,
      tooltip: slashMenuToolTips['Move Down'],
      action: ({ rootElement, model }) => {
        const doc = rootElement.doc;
        const nextSiblingModel = doc.getNext(model);
        if (!nextSiblingModel) return;

        const parentModel = doc.getParent(nextSiblingModel);
        if (!parentModel) return;

        doc.moveBlocks([model], parentModel, nextSiblingModel, false);
      },
    },
    {
      name: 'Copy',
      description: 'Copy this line to clipboard.',
      icon: PasteIcon,
      tooltip: slashMenuToolTips['Copy'],
      action: ({ rootElement, model }) => {
        const slice = Slice.fromModels(rootElement.std.doc, [model]);

        rootElement.std.clipboard
          .copy(slice)
          .then(() => {
            toast(rootElement.host, 'Copied to clipboard');
          })
          .catch(e => {
            console.error(e);
          });
      },
    },
    {
      name: 'Duplicate',
      description: 'Create a duplicate of this line.',
      icon: CopyIcon,
      tooltip: slashMenuToolTips['Copy'],
      action: ({ rootElement, model }) => {
        if (!model.text || !(model.text instanceof Text)) {
          throw new Error("Can't duplicate a block without text");
        }
        const parent = rootElement.doc.getParent(model);
        if (!parent) {
          throw new Error('Failed to duplicate block! Parent not found');
        }
        const index = parent.children.indexOf(model);

        // TODO add clone model util
        rootElement.doc.addBlock(
          model.flavour as never,
          {
            type: (model as ParagraphBlockModel).type,
            text: rootElement.doc.Text.fromDelta(model.text.toDelta()),
            // @ts-expect-error
            checked: model.checked,
          },
          rootElement.doc.getParent(model),
          index
        );
      },
    },
    {
      name: 'Delete',
      description: 'Remove this line permanently.',
      alias: ['remove'],
      icon: DeleteIcon,
      tooltip: slashMenuToolTips['Delete'],
      action: ({ rootElement, model }) => {
        rootElement.doc.deleteBlock(model);
      },
    },
  ],
};
