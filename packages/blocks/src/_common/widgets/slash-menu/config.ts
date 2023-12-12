import { assertExists, assertInstanceOf } from '@blocksuite/global/utils';
import { Text, type Y } from '@blocksuite/store';

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
import {
  createPage,
  getBlockElementByModel,
  getCurrentNativeRange,
  getInlineEditorByModel,
  matchFlavours,
  openFileOrFiles,
  resetNativeSelection,
  uploadImageFromLocal,
} from '../../../_common/utils/index.js';
import { getServiceOrRegister } from '../../../_legacy/service/index.js';
import { AttachmentService } from '../../../attachment-block/attachment-service.js';
import { addSiblingAttachmentBlock } from '../../../attachment-block/utils.js';
import { toggleBookmarkCreateModal } from '../../../bookmark-block/components/modal/bookmark-create-modal.js';
import type { FrameBlockModel } from '../../../frame-block/index.js';
import type { ImageBlockProps } from '../../../image-block/image-model.js';
import type { SurfaceBlockModel } from '../../../models.js';
import type { NoteBlockModel } from '../../../note-block/index.js';
import { copyBlock } from '../../../page-block/doc/utils.js';
import { onModelTextUpdated } from '../../../page-block/utils/index.js';
import { updateBlockElementType } from '../../../page-block/utils/operations/element/block-level.js';
import type { ParagraphBlockModel } from '../../../paragraph-block/index.js';
import { CanvasElementType } from '../../../surface-block/index.js';
import { REFERENCE_NODE } from '../../components/rich-text/consts.js';
import { toast } from '../../components/toast.js';
import { textConversionConfigs } from '../../configs/text-conversion.js';
import { textFormatConfigs } from '../../configs/text-format/config.js';
import { clearMarksOnDiscontinuousInput } from '../../utils/inline-editor.js';
import type { AffineLinkedPageWidget } from '../linked-page/index.js';
import {
  formatDate,
  insertContent,
  insideDatabase,
  type SlashItem,
  type SlashMenuOptions,
  withRemoveEmptyLine,
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
                  onModelTextUpdated(codeModel, richText => {
                    const inlineEditor = richText.inlineEditor;
                    assertExists(inlineEditor);
                    inlineEditor.focusEnd();
                  });
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
        action: ({ model }) => {
          if (!model.text) {
            return;
          }
          const len = model.text.length;
          if (!len) {
            const inlineEditor = getInlineEditorByModel(model);
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
    name: 'Pages',
    items: [
      {
        name: 'New Page',
        icon: NewPageIcon,
        action: async ({ pageElement, model }) => {
          const newPage = await createPage(pageElement.page.workspace);
          insertContent(model, REFERENCE_NODE, {
            reference: {
              type: 'LinkedPage',
              pageId: newPage.id,
            },
          });
        },
      },
      {
        name: 'Link Page',
        alias: ['dual link'],
        icon: DualLinkIcon,
        showWhen: model => {
          assertExists(model.page.root);
          const pageBlock = getBlockElementByModel(model.page.root);
          assertExists(pageBlock);
          const linkedPageWidgetEle =
            pageBlock.widgetElements['affine-linked-page-widget'];
          if (!linkedPageWidgetEle) return false;
          if (!('showLinkedPage' in linkedPageWidgetEle)) {
            console.warn(
              'You may not have correctly implemented the linkedPage widget! "showLinkedPage(model)" method not found on widget'
            );
            return false;
          }
          return true;
        },
        action: ({ model }) => {
          const triggerKey = '@';
          insertContent(model, triggerKey);
          assertExists(model.page.root);
          const pageBlock = getBlockElementByModel(model.page.root);
          const widgetEle =
            pageBlock?.widgetElements['affine-linked-page-widget'];
          assertExists(widgetEle);
          // We have checked the existence of showLinkedPage method in the showWhen
          const linkedPageWidget = widgetEle as AffineLinkedPageWidget;
          // Wait for range to be updated
          setTimeout(() => {
            linkedPageWidget.showLinkedPage(model, triggerKey);
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
        action: withRemoveEmptyLine(async ({ pageElement, model }) => {
          const parent = pageElement.page.getParent(model);
          if (!parent) {
            return;
          }
          const fileData = await uploadImageFromLocal(pageElement.page.blob);
          const props = fileData.map(
            ({
              sourceId,
            }): Partial<ImageBlockProps> & {
              flavour: 'affine:image';
            } => ({
              flavour: 'affine:image',
              sourceId,
            })
          );
          pageElement.page.addSiblingBlocks(model, props);
        }),
      },
      {
        name: 'Bookmark',
        icon: BookmarkIcon,
        showWhen: model => {
          if (!model.page.schema.flavourSchemaMap.has('affine:bookmark')) {
            return false;
          }
          return !insideDatabase(model);
        },
        action: withRemoveEmptyLine(async ({ pageElement, model }) => {
          const parent = pageElement.page.getParent(model);
          if (!parent) {
            return;
          }
          const url = await toggleBookmarkCreateModal(pageElement.host);
          if (!url) return;
          const props = {
            flavour: 'affine:bookmark',
            url,
          } as const;
          pageElement.page.addSiblingBlocks(model, [props]);
        }),
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
        action: withRemoveEmptyLine(async ({ pageElement, model }) => {
          const page = pageElement.page;
          const parent = page.getParent(model);
          if (!parent) return;
          const file = await openFileOrFiles();
          if (!file) return;
          const service = pageElement.host.spec.getService('affine:attachment');
          assertExists(service);
          assertInstanceOf(service, AttachmentService);
          const maxFileSize = service.maxFileSize;
          addSiblingAttachmentBlock(file, model, maxFileSize);
        }),
      },
    ],
  },
  {
    name: 'Date & Time',
    items: [
      {
        name: 'Today',
        icon: TodayIcon,
        action: ({ model }) => {
          const date = new Date();
          insertContent(model, formatDate(date));
        },
      },
      {
        name: 'Tomorrow',
        icon: TomorrowIcon,
        action: ({ model }) => {
          // yyyy-mm-dd
          const date = new Date();
          date.setDate(date.getDate() + 1);
          insertContent(model, formatDate(date));
        },
      },
      {
        name: 'Yesterday',
        icon: YesterdayIcon,
        action: ({ model }) => {
          const date = new Date();
          date.setDate(date.getDate() - 1);
          insertContent(model, formatDate(date));
        },
      },
      {
        name: 'Now',
        icon: NowIcon,
        action: ({ model }) => {
          // For example 7:13 pm
          // https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format
          const date = new Date();
          let hours = date.getHours();
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const amOrPm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          const strTime = hours + ':' + minutes + ' ' + amOrPm;
          insertContent(model, strTime);
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
        action: withRemoveEmptyLine(async ({ pageElement, model }) => {
          const parent = pageElement.page.getParent(model);
          assertExists(parent);
          const index = parent.children.indexOf(model);

          const id = pageElement.page.addBlock(
            'affine:database',
            {},
            pageElement.page.getParent(model),
            index + 1
          );
          const service = await getServiceOrRegister('affine:database');
          service.initDatabaseBlock(
            pageElement.page,
            model,
            id,
            'table',
            false
          );
        }),
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
        action: withRemoveEmptyLine(async ({ model, pageElement }) => {
          const parent = pageElement.page.getParent(model);
          assertExists(parent);
          const index = parent.children.indexOf(model);

          const id = pageElement.page.addBlock(
            'affine:database',
            {},
            pageElement.page.getParent(model),
            index + 1
          );
          const service = await getServiceOrRegister('affine:database');
          service.initDatabaseBlock(
            pageElement.page,
            model,
            id,
            'kanban',
            false
          );
        }),
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
          action: async ({ pageElement, model }) => {
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
            action: async ({ pageElement, model }) => {
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
        action: async ({ pageElement, model }) => {
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
        action: async ({ pageElement, model }) => {
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
        action: async ({ model }) => {
          const curRange = getCurrentNativeRange();
          await copyBlock(model);
          resetNativeSelection(curRange);
          toast('Copied to clipboard');
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
];
