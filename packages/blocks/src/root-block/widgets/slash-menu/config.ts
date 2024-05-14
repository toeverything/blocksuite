import { assertExists } from '@blocksuite/global/utils';
import { Slice, Text, type Y } from '@blocksuite/store';

import { toggleEmbedCardCreateModal } from '../../../_common/components/embed-card/modal/embed-card-create-modal.js';
import { toast } from '../../../_common/components/toast.js';
import { textConversionConfigs } from '../../../_common/configs/text-conversion.js';
import { textFormatConfigs } from '../../../_common/configs/text-format/config.js';
import {
  ArrowDownBigIcon,
  ArrowUpBigIcon,
  AttachmentIcon,
  BookmarkIcon,
  CopyIcon,
  DatabaseKanbanViewIcon20,
  DatabaseTableViewIcon20,
  DeleteIcon,
  DualLinkIcon,
  DuplicateIcon,
  FrameIcon,
  ImageIcon20,
  NewDocIcon,
  NowIcon,
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
import type { FrameBlockModel } from '../../../frame-block/index.js';
import { addSiblingImageBlock } from '../../../image-block/utils.js';
import type { NoteBlockModel } from '../../../note-block/index.js';
import type { ParagraphBlockModel } from '../../../paragraph-block/index.js';
import { onModelTextUpdated } from '../../../root-block/utils/index.js';
import type { SurfaceBlockModel } from '../../../surface-block/index.js';
import { CanvasElementType } from '../../../surface-block/index.js';
import type { AffineLinkedDocWidget } from '../linked-doc/index.js';
import {
  formatDate,
  insertContent,
  insideDatabase,
  type SlashItem,
  type SlashMenuOptions,
  tryRemoveEmptyLine,
} from './utils.js';

export const menuGroups: SlashMenuOptions['menus'] = [
  {
    name: 'Text',
    items: textConversionConfigs
      .filter(i => i.flavour !== 'affine:list')
      .map<Omit<SlashItem, 'groupName'>>(({ name, icon, flavour, type }) => ({
        name,
        icon,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has(flavour)) {
            return false;
          }

          if (['Quote', 'Code Block', 'Divider'].includes(name)) {
            return !insideDatabase(model);
          }
          return true;
        },
        action: ({ rootElement }) => {
          rootElement.host.std.command
            .chain()
            .updateBlockType({
              flavour,
              props: { type },
            })
            .inline((ctx, next) => {
              const newModels = ctx.updatedBlocks;
              if (!newModels) {
                return false;
              }

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
  },
  {
    name: 'Style',
    items: textFormatConfigs
      .filter(i => !['Link', 'Code'].includes(i.name))
      .map(({ name, icon, id }) => ({
        name,
        icon,
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
  },
  {
    name: 'List',
    items: textConversionConfigs
      .filter(i => i.flavour === 'affine:list')
      .map(({ name, icon, flavour, type }) => ({
        name,
        icon,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has(flavour)) {
            return false;
          }
          return true;
        },
        action: ({ rootElement }) => {
          rootElement.host.std.command
            .chain()
            .updateBlockType({
              flavour,
              props: { type },
            })
            .run();
        },
      })),
  },

  {
    name: 'Docs',
    items: [
      {
        name: 'New Doc',
        icon: NewDocIcon,
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
        name: 'Link Doc',
        alias: ['dual link'],
        icon: DualLinkIcon,
        showWhen: (_, rootElement) => {
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
            const inlineEditor = getInlineEditorByModel(
              rootElement.host,
              model
            );
            assertExists(inlineEditor);
            linkedDocWidget.showLinkedDoc(inlineEditor, triggerKey);
          });
        },
      },
    ],
  },
  {
    name: 'Content & Media',
    items: [
      {
        name: 'Image',
        icon: ImageIcon20,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:image')) {
            return false;
          }
          if (insideDatabase(model)) {
            return false;
          }
          return true;
        },
        action: async ({ rootElement, model }) => {
          const parent = rootElement.doc.getParent(model);
          if (!parent) {
            return;
          }

          const imageFiles = await getImageFilesFromLocal();
          if (!imageFiles.length) return;

          const imageService = rootElement.host.spec.getService('affine:image');
          const maxFileSize = imageService.maxFileSize;

          addSiblingImageBlock(
            rootElement.host,
            imageFiles,
            maxFileSize,
            model
          );
          tryRemoveEmptyLine(model);
        },
      },
      {
        name: 'Links',
        icon: BookmarkIcon,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:bookmark')) {
            return false;
          }
          return !insideDatabase(model);
        },
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
        name: 'File',
        icon: AttachmentIcon,
        alias: ['attachment'],
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:attachment'))
            return false;
          return !insideDatabase(model);
        },
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
        icon: YoutubeIcon,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:embed-youtube')) {
            return false;
          }
          return !insideDatabase(model);
        },
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
        name: 'Figma',
        icon: FigmaIcon,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:embed-figma')) {
            return false;
          }
          return !insideDatabase(model);
        },
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
        name: 'GitHub',
        icon: GithubIcon,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:embed-github')) {
            return false;
          }
          return !insideDatabase(model);
        },
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
      {
        name: 'Loom',
        icon: LoomIcon,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:embed-loom')) {
            return false;
          }
          return !insideDatabase(model);
        },
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
    ],
  },
  {
    name: 'Date & Time',
    items: [
      {
        name: 'Today',
        icon: TodayIcon,
        action: ({ rootElement, model }) => {
          const date = new Date();
          insertContent(rootElement.host, model, formatDate(date));
        },
      },
      {
        name: 'Tomorrow',
        icon: TomorrowIcon,
        action: ({ rootElement, model }) => {
          // yyyy-mm-dd
          const date = new Date();
          date.setDate(date.getDate() + 1);
          insertContent(rootElement.host, model, formatDate(date));
        },
      },
      {
        name: 'Yesterday',
        icon: YesterdayIcon,
        action: ({ rootElement, model }) => {
          const date = new Date();
          date.setDate(date.getDate() - 1);
          insertContent(rootElement.host, model, formatDate(date));
        },
      },
      {
        name: 'Now',
        icon: NowIcon,
        action: ({ rootElement, model }) => {
          // For example 7:13 pm
          // https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format
          const date = new Date();
          let hours = date.getHours();
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const amOrPm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          const strTime = hours + ':' + minutes + ' ' + amOrPm;
          insertContent(rootElement.host, model, strTime);
        },
      },
    ],
  },
  {
    name: 'Query',
    items: [
      {
        name: 'Todo',
        alias: ['todo view'],
        icon: DatabaseTableViewIcon20,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:database')) {
            return false;
          }
          if (insideDatabase(model)) {
            // You can't add a database block inside another database block
            return false;
          }
          if (!model.doc.awarenessStore.getFlag('enable_block_query')) {
            return false;
          }
          return true;
        },
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
    ],
  },
  {
    name: 'Database',
    items: [
      {
        name: 'Table View',
        alias: ['database'],
        icon: DatabaseTableViewIcon20,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:database')) {
            return false;
          }
          if (insideDatabase(model)) {
            // You can't add a database block inside another database block
            return false;
          }
          return true;
        },
        action: ({ rootElement, model }) => {
          const parent = rootElement.doc.getParent(model);
          assertExists(parent);
          const index = parent.children.indexOf(model);

          const id = rootElement.doc.addBlock(
            'affine:database',
            {},
            rootElement.doc.getParent(model),
            index + 1
          );
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
        name: 'Kanban View',
        alias: ['database'],
        disabled: false,
        icon: DatabaseKanbanViewIcon20,
        showWhen: model => {
          if (!model.doc.schema.flavourSchemaMap.has('affine:database')) {
            return false;
          }
          if (insideDatabase(model)) {
            // You can't add a database block inside another database block
            return false;
          }
          return true;
        },
        action: ({ model, rootElement }) => {
          const parent = rootElement.doc.getParent(model);
          assertExists(parent);
          const index = parent.children.indexOf(model);

          const id = rootElement.doc.addBlock(
            'affine:database',
            {},
            rootElement.doc.getParent(model),
            index + 1
          );
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
    ],
  },
  {
    name: 'Frames',
    items: options => {
      const frameModels = options.rootElement.doc.getBlockByFlavour(
        'affine:frame'
      ) as FrameBlockModel[];

      return frameModels.map(frameModel => {
        return {
          name: 'Frame: ' + frameModel.title,
          icon: FrameIcon,
          action: ({ rootElement, model }) => {
            const { doc } = rootElement;
            const noteModel = doc.getParent(model) as NoteBlockModel;
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
        };
      });
    },
  },
  {
    name: 'Group',
    items: options => {
      const surfaceModel = (
        options.rootElement.doc.getBlockByFlavour(
          'affine:surface'
        ) as SurfaceBlockModel[]
      )[0];

      if (!surfaceModel) return [];
      const groupElements = (<Array<Y.Map<string>>>(
        Array.from(surfaceModel.elements.getValue()?.values() ?? [])
      )).filter(element => element.get('type') === CanvasElementType.GROUP);

      return (
        groupElements.map(element => {
          return {
            name: 'Group: ' + element.get('title'),
            icon: GroupingIcon,
            action: ({ rootElement, model }) => {
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
          };
        }) ?? []
      );
    },
  },
  {
    name: 'Actions',
    items: [
      {
        name: 'Move Up',
        icon: ArrowUpBigIcon,
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
        icon: ArrowDownBigIcon,
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
        icon: CopyIcon,
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
      // {
      //   name: 'Paste',
      //   icon: PasteIcon,
      //   action: async ({ model }) => {
      //     const copiedText = await navigator.clipboard.readText();
      //     console.log('copiedText', copiedText);
      //     insertContent(model, copiedText);
      //   },
      // },
      {
        name: 'Duplicate',
        icon: DuplicateIcon,
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
        alias: ['remove'],
        icon: DeleteIcon,
        action: ({ rootElement, model }) => {
          rootElement.doc.deleteBlock(model);
        },
      },
    ],
  },
];
