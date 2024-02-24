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
  GroupingIcon,
  ImageIcon20,
  NewPageIcon,
  NowIcon,
  TodayIcon,
  TomorrowIcon,
  YesterdayIcon,
} from '../../../_common/icons/index.js';
import { REFERENCE_NODE } from '../../../_common/inline/presets/nodes/consts.js';
import {
  createDefaultPage,
  getImageFilesFromLocal,
  getInlineEditorByModel,
  matchFlavours,
  openFileOrFiles,
} from '../../../_common/utils/index.js';
import { clearMarksOnDiscontinuousInput } from '../../../_common/utils/inline-editor.js';
import { addSiblingAttachmentBlocks } from '../../../attachment-block/utils.js';
import { FigmaIcon } from '../../../embed-figma-block/styles.js';
import { GithubIcon } from '../../../embed-github-block/styles.js';
import { LoomIcon } from '../../../embed-loom-block/styles.js';
import { YoutubeIcon } from '../../../embed-youtube-block/styles.js';
import type { FrameBlockModel } from '../../../frame-block/index.js';
import { addSiblingImageBlock } from '../../../image-block/utils.js';
import type { SurfaceBlockModel } from '../../../models.js';
import type { NoteBlockModel } from '../../../note-block/index.js';
import { onModelTextUpdated } from '../../../page-block/utils/index.js';
import { updateBlockElementType } from '../../../page-block/utils/operations/element/block-level.js';
import type { ParagraphBlockModel } from '../../../paragraph-block/index.js';
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
    items: [
      ...textConversionConfigs
        .filter(i => i.flavour !== 'affine:list')
        .map<Omit<SlashItem, 'groupName'>>(({ name, icon, flavour, type }) => ({
          name,
          icon,
          showWhen: model => {
            if (!model.page.schema.flavourSchemaMap.has(flavour)) {
              return false;
            }

            if (['Quote', 'Code Block', 'Divider'].includes(name)) {
              return !insideDatabase(model);
            }
            return true;
          },
          action: ({ pageElement }) => {
            pageElement.host.std.command
              .pipe()
              .withHost()
              .tryAll(chain => [
                chain.getTextSelection(),
                chain.getBlockSelections(),
              ])
              .getSelectedBlocks({
                types: ['text', 'block'],
              })
              .inline(ctx => {
                const { selectedBlocks } = ctx;
                assertExists(selectedBlocks);

                const newModels = updateBlockElementType(
                  selectedBlocks,
                  flavour,
                  type
                );

                // Reset selection if the target is code block
                if (flavour === 'affine:code') {
                  if (newModels.length !== 1) {
                    throw new Error(
                      "Failed to reset selection! New model length isn't 1"
                    );
                  }
                  const codeModel = newModels[0];
                  onModelTextUpdated(pageElement.host, codeModel, richText => {
                    const inlineEditor = richText.inlineEditor;
                    assertExists(inlineEditor);
                    inlineEditor.focusEnd();
                  }).catch(console.error);
                }
              })
              .run();
          },
        })),
    ],
  },
  {
    name: 'Style',
    items: textFormatConfigs
      .filter(i => !['Link', 'Code'].includes(i.name))
      .map(({ name, icon, id }) => ({
        name,
        icon,
        action: ({ pageElement, model }) => {
          if (!model.text) {
            return;
          }
          const len = model.text.length;
          if (!len) {
            const inlineEditor = getInlineEditorByModel(
              pageElement.host,
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
          if (!model.page.schema.flavourSchemaMap.has(flavour)) {
            return false;
          }
          return true;
        },
        action: ({ pageElement }) => {
          pageElement.host.std.command
            .pipe()
            .withHost()
            .tryAll(chain => [
              chain.getTextSelection(),
              chain.getBlockSelections(),
            ])
            .getSelectedBlocks({
              types: ['text', 'block'],
            })
            .inline(ctx => {
              const { selectedBlocks } = ctx;
              assertExists(selectedBlocks);

              updateBlockElementType(selectedBlocks, flavour, type);
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
        icon: NewPageIcon,
        action: ({ pageElement, model }) => {
          const newPage = createDefaultPage(pageElement.page.workspace);
          insertContent(pageElement.host, model, REFERENCE_NODE, {
            reference: {
              type: 'LinkedPage',
              pageId: newPage.id,
            },
          });
        },
      },
      {
        name: 'Link Doc',
        alias: ['dual link'],
        icon: DualLinkIcon,
        showWhen: (_, pageElement) => {
          const linkedDocWidgetEle =
            pageElement.widgetElements['affine-linked-doc-widget'];
          if (!linkedDocWidgetEle) return false;
          if (!('showLinkedDoc' in linkedDocWidgetEle)) {
            console.warn(
              'You may not have correctly implemented the linkedDoc widget! "showLinkedDoc(model)" method not found on widget'
            );
            return false;
          }
          return true;
        },
        action: ({ model, pageElement }) => {
          const triggerKey = '@';
          insertContent(pageElement.host, model, triggerKey);
          assertExists(model.page.root);
          const widgetEle =
            pageElement.widgetElements['affine-linked-doc-widget'];
          assertExists(widgetEle);
          // We have checked the existence of showLinkedDoc method in the showWhen
          const linkedDocWidget = widgetEle as AffineLinkedDocWidget;
          // Wait for range to be updated
          setTimeout(() => {
            linkedDocWidget.showLinkedDoc(model, triggerKey);
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
          if (!model.page.schema.flavourSchemaMap.has('affine:image')) {
            return false;
          }
          if (insideDatabase(model)) {
            return false;
          }
          return true;
        },
        action: async ({ pageElement, model }) => {
          const parent = pageElement.page.getParent(model);
          if (!parent) {
            return;
          }

          const imageFiles = await getImageFilesFromLocal();

          const imageService = pageElement.host.spec.getService('affine:image');
          const maxFileSize = imageService.maxFileSize;

          addSiblingImageBlock(
            pageElement.host,
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
          if (!model.page.schema.flavourSchemaMap.has('affine:bookmark')) {
            return false;
          }
          return !insideDatabase(model);
        },
        action: async ({ pageElement, model }) => {
          const parentModel = pageElement.page.getParent(model);
          if (!parentModel) {
            return;
          }
          const index = parentModel.children.indexOf(model) + 1;
          await toggleEmbedCardCreateModal(
            pageElement.host,
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
          if (!model.page.schema.flavourSchemaMap.has('affine:attachment'))
            return false;
          return !insideDatabase(model);
        },
        action: async ({ pageElement, model }) => {
          const file = await openFileOrFiles();
          if (!file) return;

          const attachmentService =
            pageElement.host.spec.getService('affine:attachment');
          assertExists(attachmentService);
          const maxFileSize = attachmentService.maxFileSize;

          addSiblingAttachmentBlocks(
            pageElement.host,
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
          if (!model.page.schema.flavourSchemaMap.has('affine:embed-youtube')) {
            return false;
          }
          return !insideDatabase(model);
        },
        action: async ({ pageElement, model }) => {
          const parentModel = pageElement.page.getParent(model);
          if (!parentModel) {
            return;
          }
          const index = parentModel.children.indexOf(model) + 1;
          await toggleEmbedCardCreateModal(
            pageElement.host,
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
          if (!model.page.schema.flavourSchemaMap.has('affine:embed-figma')) {
            return false;
          }
          return !insideDatabase(model);
        },
        action: async ({ pageElement, model }) => {
          const parentModel = pageElement.page.getParent(model);
          if (!parentModel) {
            return;
          }
          const index = parentModel.children.indexOf(model) + 1;
          await toggleEmbedCardCreateModal(
            pageElement.host,
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
          if (!model.page.schema.flavourSchemaMap.has('affine:embed-github')) {
            return false;
          }
          return !insideDatabase(model);
        },
        action: async ({ pageElement, model }) => {
          const parentModel = pageElement.page.getParent(model);
          if (!parentModel) {
            return;
          }
          const index = parentModel.children.indexOf(model) + 1;
          await toggleEmbedCardCreateModal(
            pageElement.host,
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
          if (!model.page.schema.flavourSchemaMap.has('affine:embed-loom')) {
            return false;
          }
          return !insideDatabase(model);
        },
        action: async ({ pageElement, model }) => {
          const parentModel = pageElement.page.getParent(model);
          if (!parentModel) {
            return;
          }
          const index = parentModel.children.indexOf(model) + 1;
          await toggleEmbedCardCreateModal(
            pageElement.host,
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
        action: ({ pageElement, model }) => {
          const date = new Date();
          insertContent(pageElement.host, model, formatDate(date));
        },
      },
      {
        name: 'Tomorrow',
        icon: TomorrowIcon,
        action: ({ pageElement, model }) => {
          // yyyy-mm-dd
          const date = new Date();
          date.setDate(date.getDate() + 1);
          insertContent(pageElement.host, model, formatDate(date));
        },
      },
      {
        name: 'Yesterday',
        icon: YesterdayIcon,
        action: ({ pageElement, model }) => {
          const date = new Date();
          date.setDate(date.getDate() - 1);
          insertContent(pageElement.host, model, formatDate(date));
        },
      },
      {
        name: 'Now',
        icon: NowIcon,
        action: ({ pageElement, model }) => {
          // For example 7:13 pm
          // https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format
          const date = new Date();
          let hours = date.getHours();
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const amOrPm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          const strTime = hours + ':' + minutes + ' ' + amOrPm;
          insertContent(pageElement.host, model, strTime);
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
          if (!model.page.schema.flavourSchemaMap.has('affine:database')) {
            return false;
          }
          if (insideDatabase(model)) {
            // You can't add a database block inside another database block
            return false;
          }
          return true;
        },
        action: ({ pageElement, model }) => {
          const parent = pageElement.page.getParent(model);
          assertExists(parent);
          const index = parent.children.indexOf(model);

          const id = pageElement.page.addBlock(
            'affine:database',
            {},
            pageElement.page.getParent(model),
            index + 1
          );
          const service = pageElement.std.spec.getService('affine:database');
          service.initDatabaseBlock(
            pageElement.page,
            model,
            id,
            'table',
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
          if (!model.page.schema.flavourSchemaMap.has('affine:database')) {
            return false;
          }
          if (insideDatabase(model)) {
            // You can't add a database block inside another database block
            return false;
          }
          return true;
        },
        action: ({ model, pageElement }) => {
          const parent = pageElement.page.getParent(model);
          assertExists(parent);
          const index = parent.children.indexOf(model);

          const id = pageElement.page.addBlock(
            'affine:database',
            {},
            pageElement.page.getParent(model),
            index + 1
          );
          const service = pageElement.std.spec.getService('affine:database');
          service.initDatabaseBlock(
            pageElement.page,
            model,
            id,
            'kanban',
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
      const frameModels = options.pageElement.page.getBlockByFlavour(
        'affine:frame'
      ) as FrameBlockModel[];

      return frameModels.map(frameModel => {
        return {
          name: 'Frame: ' + frameModel.title,
          icon: FrameIcon,
          action: ({ pageElement, model }) => {
            const { page } = pageElement;
            const noteModel = page.getParent(model) as NoteBlockModel;
            const insertIdx = noteModel.children.indexOf(model);
            const surfaceRefProps = {
              flavour: 'affine:surface-ref',
              reference: frameModel.id,
              refFlavour: 'affine:frame',
            };

            page.addSiblingBlocks(
              model,
              [surfaceRefProps],
              insertIdx === 0 ? 'before' : 'after'
            );

            if (
              matchFlavours(model, ['affine:paragraph']) &&
              model.text.length === 0
            ) {
              page.deleteBlock(model);
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
        options.pageElement.page.getBlockByFlavour(
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
            action: ({ pageElement, model }) => {
              const { page } = pageElement;
              const noteModel = page.getParent(model) as NoteBlockModel;
              const insertIdx = noteModel.children.indexOf(model);
              const surfaceRefProps = {
                flavour: 'affine:surface-ref',
                reference: element.get('id'),
                refFlavour: 'group',
              };

              page.addSiblingBlocks(
                model,
                [surfaceRefProps],
                insertIdx === 0 ? 'before' : 'after'
              );

              if (
                matchFlavours(model, ['affine:paragraph']) &&
                model.text.length === 0
              ) {
                page.deleteBlock(model);
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
        action: ({ pageElement, model }) => {
          const page = pageElement.page;
          const previousSiblingModel = page.getPreviousSibling(model);
          if (!previousSiblingModel) return;

          const parentModel = page.getParent(previousSiblingModel);
          if (!parentModel) return;

          page.moveBlocks([model], parentModel, previousSiblingModel, true);
        },
      },
      {
        name: 'Move Down',
        icon: ArrowDownBigIcon,
        action: ({ pageElement, model }) => {
          const page = pageElement.page;
          const nextSiblingModel = page.getNextSibling(model);
          if (!nextSiblingModel) return;

          const parentModel = page.getParent(nextSiblingModel);
          if (!parentModel) return;

          page.moveBlocks([model], parentModel, nextSiblingModel, false);
        },
      },
      {
        name: 'Copy',
        icon: CopyIcon,
        action: ({ pageElement, model }) => {
          const slice = Slice.fromModels(pageElement.std.page, [model]);

          pageElement.std.clipboard
            .copy(slice)
            .then(() => {
              toast(pageElement.host, 'Copied to clipboard');
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
        action: ({ pageElement, model }) => {
          if (!model.text || !(model.text instanceof Text)) {
            throw new Error("Can't duplicate a block without text");
          }
          const parent = pageElement.page.getParent(model);
          if (!parent) {
            throw new Error('Failed to duplicate block! Parent not found');
          }
          const index = parent.children.indexOf(model);

          // TODO add clone model util
          pageElement.page.addBlock(
            model.flavour,
            {
              type: (model as ParagraphBlockModel).type,
              text: pageElement.page.Text.fromDelta(model.text.toDelta()),
              // @ts-expect-error
              checked: model.checked,
            },
            pageElement.page.getParent(model),
            index
          );
        },
      },
      {
        name: 'Delete',
        alias: ['remove'],
        icon: DeleteIcon,
        action: ({ pageElement, model }) => {
          pageElement.page.deleteBlock(model);
        },
      },
    ],
  },
  {
    name: 'Layout',
    items: [
      {
        name: 'Columns',
        alias: ['column', 'grid'],
        icon: BookmarkIcon,
        showWhen: model => {
          return !insideDatabase(model);
        },
        action: ({ model, pageElement }) => {
          const parent = pageElement.page.getParent(model);
          assertExists(parent);
          const index = parent.children.indexOf(model);

          const id = pageElement.page.addBlock(
            'affine:columns',
            {
              columnNumber: 2,
            },
            pageElement.page.getParent(model),
            index + 1
          );

          const ids = pageElement.page.addBlocks(
            [
              {
                flavour: 'affine:note',
              },
              {
                flavour: 'affine:note',
              },
            ] as NoteBlockModel[],
            id
          );

          ids.forEach(id => {
            const noteModel = pageElement.page.getBlockById(id);
            assertExists(noteModel);
            const note = noteModel as NoteBlockModel;
            pageElement.page.addBlock(
              'affine:paragraph',
              {
                flavour: 'affine:paragraph',
                type: 'text',
                text: pageElement.page.Text.fromDelta([{ insert: 'Column 2' }]),
              },
              note,
              0
            );
          });

          tryRemoveEmptyLine(model);
        },
      },
    ],
  },
];
