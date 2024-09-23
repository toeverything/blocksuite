import type {
  FrameBlockModel,
  ParagraphBlockModel,
} from '@blocksuite/affine-model';
import type { BlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import {
  FigmaIcon,
  GithubIcon,
  LoomIcon,
  YoutubeIcon,
} from '@blocksuite/affine-block-embed';
import { CanvasElementType } from '@blocksuite/affine-block-surface';
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
} from '@blocksuite/affine-components/icons';
import {
  clearMarksOnDiscontinuousInput,
  getInlineEditorByModel,
  REFERENCE_NODE,
  textFormatConfigs,
} from '@blocksuite/affine-components/rich-text';
import { toast } from '@blocksuite/affine-components/toast';
import {
  createDefaultDoc,
  getImageFilesFromLocal,
  matchFlavours,
  openFileOrFiles,
} from '@blocksuite/affine-shared/utils';
import { viewPresets } from '@blocksuite/data-view/view-presets';
import { GroupingIcon, TeXIcon } from '@blocksuite/icons/lit';
import { Slice, Text } from '@blocksuite/store';

import type { DataViewBlockComponent } from '../../../data-view-block/index.js';
import type { RootBlockComponent } from '../../types.js';
import type { AffineLinkedDocWidget } from '../linked-doc/index.js';

import { toggleEmbedCardCreateModal } from '../../../_common/components/embed-card/modal/embed-card-create-modal.js';
import { textConversionConfigs } from '../../../_common/configs/text-conversion.js';
import { addSiblingAttachmentBlocks } from '../../../attachment-block/utils.js';
import { addSiblingImageBlock } from '../../../image-block/utils.js';
import { LatexBlockComponent } from '../../../latex-block/latex-block.js';
import { onModelTextUpdated } from '../../../root-block/utils/index.js';
import { getSurfaceBlock } from '../../../surface-ref-block/utils.js';
import { type SlashMenuTooltip, slashMenuToolTips } from './tooltips/index.js';
import {
  createConversionItem,
  createDatabaseBlockInNextLine,
  formatDate,
  formatTime,
  insertContent,
  insideDatabase,
  insideEdgelessText,
  tryRemoveEmptyLine,
} from './utils.js';

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
  rootComponent: RootBlockComponent;
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
      .filter(i => i.type && ['h1', 'h2', 'h3', 'text'].includes(i.type))
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
        action: ({ rootComponent }) => {
          const { flavour, type } = config;
          rootComponent.host.std.command
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
                onModelTextUpdated(rootComponent.host, codeModel, richText => {
                  const inlineEditor = richText.inlineEditor;
                  if (!inlineEditor) return;
                  inlineEditor.focusEnd();
                }).catch(console.error);
              }

              return next();
            })
            .run();
        },
      })),

    ...textConversionConfigs
      .filter(i => i.type && ['divider', 'quote'].includes(i.type))
      .map<SlashMenuActionItem>(config => ({
        ...createConversionItem(config),
        showWhen: ({ model }) =>
          model.doc.schema.flavourSchemaMap.has(config.flavour) &&
          !insideDatabase(model) &&
          !insideEdgelessText(model),
      })),

    {
      name: 'Inline equation',
      description: 'Create a equation block.',
      icon: TeXIcon({
        width: '20',
        height: '20',
      }),
      alias: ['inlineMath, inlineEquation', 'inlineLatex'],
      action: ({ rootComponent }) => {
        const selectionManager = rootComponent.host.selection;
        const textSelection = selectionManager.filter('text')[0];
        if (!textSelection || !textSelection.isCollapsed()) return;

        const blockComponent = rootComponent.std.view.getBlock(
          textSelection.from.blockId
        );
        if (!blockComponent) return;

        const richText = blockComponent.querySelector('rich-text');
        if (!richText) return;
        const inlineEditor = richText.inlineEditor;
        if (!inlineEditor) return;

        inlineEditor.insertText(
          {
            index: textSelection.from.index,
            length: 0,
          },
          ' '
        );
        inlineEditor.formatText(
          {
            index: textSelection.from.index,
            length: 1,
          },
          {
            latex: '',
          }
        );
        inlineEditor.setInlineRange({
          index: textSelection.from.index,
          length: 1,
        });

        inlineEditor
          .waitForUpdate()
          .then(async () => {
            await inlineEditor.waitForUpdate();

            const textPoint = inlineEditor.getTextPoint(
              textSelection.from.index + 1
            );
            if (!textPoint) return;
            const [text] = textPoint;
            const latexNode = text.parentElement?.closest('affine-latex-node');
            if (!latexNode) return;
            latexNode.toggleEditor();
          })
          .catch(console.error);
      },
    },

    // ---------------------------------------------------------
    { groupName: 'List' },
    ...textConversionConfigs
      .filter(i => i.flavour === 'affine:list')
      .map(createConversionItem),

    // ---------------------------------------------------------
    { groupName: 'Style' },
    ...textFormatConfigs
      .filter(i => !['Code', 'Link'].includes(i.name))
      .map<SlashMenuActionItem>(({ name, icon, id }) => ({
        name,
        icon,
        tooltip: slashMenuToolTips[name],
        action: ({ rootComponent, model }) => {
          if (!model.text) {
            return;
          }
          const len = model.text.length;
          if (!len) {
            const inlineEditor = getInlineEditorByModel(
              rootComponent.host,
              model
            );
            if (!inlineEditor) return;
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
    {
      groupName: 'Page',
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-linked-doc'),
    },
    {
      name: 'New Doc',
      description: 'Start a new document.',
      icon: NewDocIcon,
      tooltip: slashMenuToolTips['New Doc'],
      showWhen: ({ model }) =>
        model.doc.schema.flavourSchemaMap.has('affine:embed-linked-doc'),
      action: ({ rootComponent, model }) => {
        const newDoc = createDefaultDoc(rootComponent.doc.collection);
        insertContent(rootComponent.host, model, REFERENCE_NODE, {
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
      showWhen: ({ rootComponent, model }) => {
        const linkedDocWidgetEle =
          rootComponent.widgetComponents['affine-linked-doc-widget'];
        if (!linkedDocWidgetEle) return false;

        const hasLinkedDocSchema = model.doc.schema.flavourSchemaMap.has(
          'affine:embed-linked-doc'
        );
        if (!hasLinkedDocSchema) return false;

        if (!('showLinkedDocPopover' in linkedDocWidgetEle)) {
          console.warn(
            'You may not have correctly implemented the linkedDoc widget! "showLinkedDoc(model)" method not found on widget'
          );
          return false;
        }
        return true;
      },
      action: ({ model, rootComponent }) => {
        const triggerKey = '@';
        insertContent(rootComponent.host, model, triggerKey);
        if (!model.doc.root) return;
        const widgetEle =
          rootComponent.widgetComponents['affine-linked-doc-widget'];
        if (!widgetEle) return;
        // We have checked the existence of showLinkedDoc method in the showWhen
        const linkedDocWidget = widgetEle as AffineLinkedDocWidget;
        // Wait for range to be updated
        setTimeout(() => {
          const inlineEditor = getInlineEditorByModel(
            rootComponent.host,
            model
          );
          if (!inlineEditor) return;
          linkedDocWidget.showLinkedDocPopover(inlineEditor, triggerKey);
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
      action: async ({ rootComponent, model }) => {
        const parent = rootComponent.doc.getParent(model);
        if (!parent) {
          return;
        }

        const imageFiles = await getImageFilesFromLocal();
        if (!imageFiles.length) return;

        const imageService = rootComponent.std.getService('affine:image');
        if (!imageService) return;
        const maxFileSize = imageService.maxFileSize;

        addSiblingImageBlock(
          rootComponent.host,
          imageFiles,
          maxFileSize,
          model
        );
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
      action: async ({ rootComponent, model }) => {
        const parentModel = rootComponent.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootComponent.host,
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
      action: async ({ rootComponent, model }) => {
        const file = await openFileOrFiles();
        if (!file) return;

        const attachmentService =
          rootComponent.std.getService('affine:attachment');
        if (!attachmentService) return;
        const maxFileSize = attachmentService.maxFileSize;

        await addSiblingAttachmentBlocks(
          rootComponent.host,
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
      action: async ({ rootComponent, model }) => {
        const parentModel = rootComponent.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootComponent.host,
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
      action: async ({ rootComponent, model }) => {
        const parentModel = rootComponent.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootComponent.host,
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
      action: async ({ rootComponent, model }) => {
        const parentModel = rootComponent.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootComponent.host,
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
      action: async ({ rootComponent, model }) => {
        const parentModel = rootComponent.doc.getParent(model);
        if (!parentModel) {
          return;
        }
        const index = parentModel.children.indexOf(model) + 1;
        await toggleEmbedCardCreateModal(
          rootComponent.host,
          'Loom',
          'The added Loom video link will be displayed as an embed view.',
          { mode: 'page', parentModel, index }
        );
        tryRemoveEmptyLine(model);
      },
    },

    {
      name: 'Equation',
      description: 'Create a equation block.',
      icon: TeXIcon({
        width: '20',
        height: '20',
      }),
      alias: ['mathBlock, equationBlock', 'latexBlock'],
      action: ({ rootComponent, model }) => {
        const doc = rootComponent.doc;
        const parent = doc.getParent(model);
        if (!parent) return;

        const index = parent.children.indexOf(model);
        if (index === -1) return;

        const id = doc.addBlock(
          'affine:latex',
          {
            latex: '',
          },
          parent,
          index + 1
        );
        rootComponent.host.updateComplete
          .then(async () => {
            const blockComponent = rootComponent.std.view.getBlock(id);
            if (!(blockComponent instanceof LatexBlockComponent)) return;

            await blockComponent.updateComplete;

            blockComponent.toggleEditor();
          })
          .catch(console.error);
      },
    },

    // TODO-slash: Linear

    // TODO-slash: Group & Frame explorer

    // ---------------------------------------------------------
    ({ model, rootComponent }) => {
      const { doc } = rootComponent;

      const surfaceModel = getSurfaceBlock(doc);
      if (!surfaceModel) return [];

      const parent = doc.getParent(model);
      if (!parent) return [];

      const frameModels = doc
        .getBlocksByFlavour('affine:frame')
        .map(block => block.model) as FrameBlockModel[];
      const frameItems = frameModels.map<SlashMenuActionItem>(frameModel => ({
        name: 'Frame: ' + frameModel.title,
        icon: FrameIcon,
        showWhen: () => !insideDatabase(model),
        action: () => {
          const insertIdx = parent.children.indexOf(model);
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
            matchFlavours(model, ['affine:paragraph', 'affine:list']) &&
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
        icon: GroupingIcon(),
        action: () => {
          const { doc } = rootComponent;
          const insertIdx = parent.children.indexOf(model);
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
            matchFlavours(model, ['affine:paragraph', 'affine:list']) &&
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
          action: ({ rootComponent, model }) => {
            insertContent(rootComponent.host, model, formatDate(now));
          },
        },
        {
          name: 'Tomorrow',
          icon: TomorrowIcon,
          tooltip: slashMenuToolTips['Tomorrow'],
          description: formatDate(tomorrow),
          action: ({ rootComponent, model }) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            insertContent(rootComponent.host, model, formatDate(tomorrow));
          },
        },
        {
          name: 'Yesterday',
          icon: YesterdayIcon,
          tooltip: slashMenuToolTips['Yesterday'],
          description: formatDate(yesterday),
          action: ({ rootComponent, model }) => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            insertContent(rootComponent.host, model, formatDate(yesterday));
          },
        },
        {
          name: 'Now',
          icon: NowIcon,
          tooltip: slashMenuToolTips['Now'],
          description: formatTime(now),
          action: ({ rootComponent, model }) => {
            insertContent(rootComponent.host, model, formatTime(now));
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
      action: ({ rootComponent, model }) => {
        const id = createDatabaseBlockInNextLine(model);
        if (!id) {
          return;
        }
        const service = rootComponent.std.getService('affine:database');
        if (!service) return;
        service.initDatabaseBlock(
          rootComponent.doc,
          model,
          id,
          viewPresets.tableViewMeta.type,
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

      action: ({ model, rootComponent }) => {
        const parent = rootComponent.doc.getParent(model);
        if (!parent) return;
        const index = parent.children.indexOf(model);
        const id = rootComponent.doc.addBlock(
          'affine:data-view',
          {},
          rootComponent.doc.getParent(model),
          index + 1
        );
        const dataViewModel = rootComponent.doc.getBlock(id)!;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        Promise.resolve().then(() => {
          const dataView = rootComponent.std.view.getBlock(
            dataViewModel.id
          ) as DataViewBlockComponent | null;
          dataView?.dataSource.viewManager.viewAdd('table');
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
      action: ({ model, rootComponent }) => {
        const id = createDatabaseBlockInNextLine(model);
        if (!id) {
          return;
        }
        const service = rootComponent.std.getService('affine:database');
        if (!service) return;
        service.initDatabaseBlock(
          rootComponent.doc,
          model,
          id,
          viewPresets.kanbanViewMeta.type,
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
      action: ({ rootComponent, model }) => {
        const doc = rootComponent.doc;
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
      action: ({ rootComponent, model }) => {
        const doc = rootComponent.doc;
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
      action: ({ rootComponent, model }) => {
        const slice = Slice.fromModels(rootComponent.std.doc, [model]);

        rootComponent.std.clipboard
          .copy(slice)
          .then(() => {
            toast(rootComponent.host, 'Copied to clipboard');
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
      action: ({ rootComponent, model }) => {
        if (!model.text || !(model.text instanceof Text)) {
          console.error("Can't duplicate a block without text");
          return;
        }
        const parent = rootComponent.doc.getParent(model);
        if (!parent) {
          console.error(
            'Failed to duplicate block! Parent not found: ' +
              model.id +
              '|' +
              model.flavour
          );
          return;
        }
        const index = parent.children.indexOf(model);

        // TODO add clone model util
        rootComponent.doc.addBlock(
          model.flavour as never,
          {
            type: (model as ParagraphBlockModel).type,
            text: rootComponent.doc.Text.fromDelta(model.text.toDelta()),
            // @ts-expect-error
            checked: model.checked,
          },
          rootComponent.doc.getParent(model),
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
      action: ({ rootComponent, model }) => {
        rootComponent.doc.deleteBlock(model);
      },
    },
  ],
};
