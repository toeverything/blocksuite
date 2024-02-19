import type {
  BlockStdScope,
  SurfaceSelection,
  UIEventStateContext,
} from '@blocksuite/block-std';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import {
  type BlockSnapshot,
  fromJSON,
  Job,
  Workspace,
} from '@blocksuite/store';

import {
  DEFAULT_IMAGE_PROXY_ENDPOINT,
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../../_common/consts.js';
import type {
  EdgelessModel,
  Selectable,
  TopLevelBlockModel,
} from '../../../_common/types.js';
import { matchFlavours, Point } from '../../../_common/utils/index.js';
import { groupBy } from '../../../_common/utils/iterable.js';
import {
  blockElementGetter,
  getPageByEditorHost,
  isInsideDocEditor,
} from '../../../_common/utils/query.js';
import { isUrlInClipboard } from '../../../_common/utils/url.js';
import {
  type BookmarkBlockModel,
  BookmarkStyles,
} from '../../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaModel } from '../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { EmbedHtmlModel } from '../../../embed-html-block/embed-html-model.js';
import type { EmbedLinkedDocModel } from '../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedSyncedDocModel } from '../../../embed-synced-doc-block/embed-synced-doc-model.js';
import type { EmbedYoutubeModel } from '../../../embed-youtube-block/embed-youtube-model.js';
import type { FrameBlockModel } from '../../../frame-block/frame-model.js';
import type { ImageBlockModel } from '../../../image-block/image-model.js';
import type { AttachmentBlockModel } from '../../../models.js';
import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type { IBound } from '../../../surface-block/consts.js';
import type { EdgelessElementType } from '../../../surface-block/edgeless-types.js';
import { CanvasElementType } from '../../../surface-block/element-model/index.js';
import type { Connection } from '../../../surface-block/elements/connector/types.js';
import {
  type CanvasElement,
  GroupElementModel,
} from '../../../surface-block/index.js';
import {
  ConnectorElementModel,
  type ElementModel,
} from '../../../surface-block/index.js';
import { compare } from '../../../surface-block/managers/layer-utils.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';
import { Bound, getCommonBound } from '../../../surface-block/utils/bound.js';
import { type IVec, Vec } from '../../../surface-block/utils/vec.js';
import { PageClipboard } from '../../clipboard/index.js';
import type { PageService } from '../../index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { edgelessElementsBound } from '../utils/bound-utils.js';
import { deleteElements } from '../utils/crud.js';
import {
  isAttachmentBlock,
  isBookmarkBlock,
  isCanvasElementWithText,
  isEmbedFigmaBlock,
  isEmbedGithubBlock,
  isEmbedHtmlBlock,
  isEmbedLinkedDocBlock,
  isEmbedSyncedDocBlock,
  isEmbedYoutubeBlock,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
  isTopLevelBlock,
} from '../utils/query.js';

const BLOCKSUITE_SURFACE = 'blocksuite/surface';
const IMAGE_PNG = 'image/png';

const { GROUP } = CanvasElementType;

export class EdgelessClipboardController extends PageClipboard {
  constructor(public override host: EdgelessPageBlockComponent) {
    super(host);
  }

  private get std() {
    return this.host.std;
  }

  private get page() {
    return this.host.page;
  }

  private get surface() {
    return this.host.surface;
  }

  private get edgeless() {
    return this.surface.edgeless;
  }

  private get toolManager() {
    return this.host.tools;
  }

  private get selectionManager() {
    return this.host.service.selection;
  }

  private get _pageService() {
    const pageService = this.std.spec.getService(
      'affine:page'
    ) as PageService | null;
    assertExists(pageService);
    return pageService;
  }

  private get _exportManager() {
    return this._pageService.exportManager;
  }

  override hostConnected() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }
    this._init();
    this._initEdgelessClipboard();
  }

  private _initEdgelessClipboard = () => {
    this.host.handleEvent(
      'copy',
      ctx => {
        const { selections, selectedIds } = this.selectionManager;

        if (selectedIds.length === 0) return false;

        this._onCopy(ctx, selections);
        return;
      },
      { global: true }
    );

    this.host.handleEvent(
      'paste',
      ctx => {
        this._onPaste(ctx).catch(console.error);
      },
      { global: true }
    );

    this.host.handleEvent(
      'cut',
      ctx => {
        this._onCut(ctx);
      },
      { global: true }
    );
  };

  private _onCopy = (
    _context: UIEventStateContext,
    surfaceSelection: SurfaceSelection[]
  ) => {
    const event = _context.get('clipboardState').raw;
    event.preventDefault();

    const elements = getCopyElements(
      this.surface,
      this.selectionManager.elements
    );

    // when note active, handle copy like page mode
    if (surfaceSelection[0] && surfaceSelection[0].editing) {
      // use build-in copy handler in rich-text when copy in surface text element
      if (isCanvasElementWithText(elements[0])) return;
      this.onPageCopy(_context);
      return;
    }

    this.std.clipboard
      .writeToClipboard(async _items => {
        const data = await prepareClipboardData(elements, this.std);
        return {
          ..._items,
          [BLOCKSUITE_SURFACE]: JSON.stringify(data),
        };
      })
      .catch(console.error);
  };

  private _onPaste = async (_context: UIEventStateContext) => {
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }
    const event = _context.get('clipboardState').raw;
    event.preventDefault();

    const { selections, elements } = this.selectionManager;

    if (selections[0]?.editing) {
      // use build-in paste handler in rich-text when paste in surface text element
      if (isCanvasElementWithText(elements[0])) return;
      this.onPagePaste(_context);
      return;
    }

    const data = event.clipboardData;
    if (!data) return;

    if (isPureFileInClipboard(data)) {
      const files = data.files;
      if (files.length === 0) return;

      const { lastMousePos } = this.toolManager;
      const point = new Point(lastMousePos.x, lastMousePos.y);

      const imageFiles: File[] = [],
        attachmentFiles: File[] = [];

      [...files].forEach(file => {
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        } else {
          attachmentFiles.push(file);
        }
      });

      // when only images in clipboard, add image-blocks else add all files as attachments
      if (attachmentFiles.length === 0) {
        await this.host.addImages(imageFiles, point);
      } else {
        await this.host.addAttachments([...files], point);
      }

      return;
    }

    if (isUrlInClipboard(data)) {
      const url = data.getData('text/plain');
      const { lastMousePos } = this.toolManager;
      const [x, y] = this.host.service.viewport.toModelCoord(
        lastMousePos.x,
        lastMousePos.y
      );

      const embedOptions = this._pageService.getEmbedBlockOptions(url);
      const flavour = embedOptions
        ? (embedOptions.flavour as EdgelessElementType)
        : 'affine:bookmark';
      const style = embedOptions ? embedOptions.styles[0] : BookmarkStyles[0];
      const width = EMBED_CARD_WIDTH[style];
      const height = EMBED_CARD_HEIGHT[style];

      const id = this.host.service.addBlock(
        flavour,
        {
          xywh: Bound.fromCenter(
            Vec.toVec({
              x,
              y,
            }),
            width,
            height
          ).serialize(),
          url,
          style,
        },
        this.surface.model.id
      );

      this.selectionManager.set({
        editing: false,
        elements: [id],
      });

      return;
    }

    const json = this.std.clipboard.readFromClipboard(data);
    const elementsRawData = JSON.parse(json[BLOCKSUITE_SURFACE]);
    this._pasteShapesAndBlocks(elementsRawData);
  };

  private _onCut = (_context: UIEventStateContext) => {
    const { selections, elements } = this.selectionManager;

    if (elements.length === 0) return;

    const event = _context.get('clipboardState').event;
    event.preventDefault();

    this._onCopy(_context, selections);

    if (selections[0]?.editing) {
      // use build-in cut handler in rich-text when cut in surface text element
      if (isCanvasElementWithText(elements[0])) return;
      this.onPageCut(_context);
      return;
    }

    this.page.transact(() => {
      deleteElements(this.surface, elements);
    });

    this.selectionManager.set({
      editing: false,
      elements: [],
    });
  };

  private _createCanvasElement(
    clipboardData: Record<string, unknown>,
    idMap: Map<string, string>
  ) {
    if (clipboardData.type === GROUP) {
      const yMap = new Workspace.Y.Map();
      const children = clipboardData.children ?? {};
      for (const [key, value] of Object.entries(children)) {
        const newKey = idMap.get(key);
        assertExists(newKey);
        yMap.set(newKey, value);
      }
      clipboardData.children = yMap;
    }
    const id = this.host.service.addElement(
      clipboardData.type as CanvasElementType,
      clipboardData
    );
    const element = this.host.service.getElementById(id) as CanvasElement;
    assertExists(element);
    return element;
  }

  private _createCanvasElements(
    elements: Record<string, unknown>[],
    idMap: Map<string, string>
  ) {
    const result = groupBy(elements, item => {
      switch (item.type) {
        case 'connector':
          return 'connectors';
        case 'group':
          return 'groups';
        default:
          return 'others';
      }
    });

    return [
      ...(result.others
        ?.map(d => {
          const oldId = d.id as string;
          assertExists(oldId);
          const element = this._createCanvasElement(d, idMap);
          idMap.set(oldId, element.id);
          return element;
        })
        .filter(e => !!e) ?? []),

      ...(result.connectors?.map(connector => {
        const sourceId = (<Connection>connector.source).id;
        if (sourceId) {
          (<Connection>connector.source).id =
            idMap.get(sourceId) ?? (sourceId as string);
        }
        const targetId = (<Connection>connector.target).id;
        if (targetId) {
          (<Connection>connector.target).id =
            idMap.get(targetId) ?? (targetId as string);
        }
        const element = this._createCanvasElement(connector, idMap);
        idMap.set(connector.id as string, element.id);
        return element;
      }) ?? []),

      ...(result.groups?.map(group => {
        const oldId = group.id as string;
        assertExists(oldId);
        const element = this._createCanvasElement(group, idMap);
        idMap.set(oldId, element.id);
        return element;
      }) ?? []),
    ];
  }

  private _createNoteBlocks(
    notes: BlockSnapshot[],
    oldToNewIdMap: Map<string, string>
  ) {
    const { host } = this;
    const noteIds = notes.map(({ id, props, children }) => {
      delete props.index;
      assertExists(props.xywh);
      const noteId = host.service.addBlock(
        'affine:note',
        props,
        this.page.root!.id
      );
      const note = host.service.getElementById(noteId) as NoteBlockModel;
      if (id) oldToNewIdMap.set(id, noteId);
      assertExists(note);

      children.forEach((child, index) => {
        this.onBlockSnapshotPaste(child, this.page, note.id, index);
      });
      return noteId;
    });
    return noteIds;
  }

  private _createFrameBlocks(frames: BlockSnapshot[]) {
    const frameIds = frames.map(({ props }) => {
      const { xywh, title, background } = props;
      const frameId = this.host.service.addBlock(
        'affine:frame',
        {
          xywh,
          background,
          title: fromJSON(title),
        },
        this.surface.model.id
      );
      return frameId;
    });
    return frameIds;
  }

  private _createImageBlocks(
    images: BlockSnapshot[],
    oldToNewIdMap: Map<string, string>
  ) {
    const imageIds = images.map(({ props, id }) => {
      const { xywh, rotate, sourceId, size, width, height } = props;
      const imageId = this.host.service.addBlock(
        'affine:image',
        {
          sourceId,
          xywh,
          rotate,
          size,
          width,
          height,
        },
        this.surface.model.id
      );
      if (id) oldToNewIdMap.set(id, imageId);
      return imageId;
    });
    return imageIds;
  }

  private _createAttachmentBlocks(attachments: BlockSnapshot[]) {
    const attachmentIds = attachments.map(({ props }) => {
      const { xywh, rotate, sourceId, name, size, type, embed, style } = props;
      const attachmentId = this.host.service.addBlock(
        'affine:attachment',
        {
          xywh,
          rotate,
          sourceId,
          name,
          size,
          type,
          embed,
          style,
        },
        this.surface.model.id
      );
      return attachmentId;
    });
    return attachmentIds;
  }

  private _createBookmarkBlocks(bookmarks: BlockSnapshot[]) {
    const bookmarkIds = bookmarks.map(({ props }) => {
      const { xywh, style, url, caption, description, icon, image, title } =
        props;
      const bookmarkId = this.host.service.addBlock(
        'affine:bookmark',
        {
          xywh,
          style,
          url,
          caption,
          description,
          icon,
          image,
          title,
        },
        this.surface.model.id
      );
      return bookmarkId;
    });
    return bookmarkIds;
  }

  private _createGithubEmbedBlocks(githubEmbeds: BlockSnapshot[]) {
    const embedGithubIds = githubEmbeds.map(({ props }) => {
      const {
        xywh,
        style,
        owner,
        repo,
        githubType,
        githubId,
        url,
        caption,
        image,
        status,
        statusReason,
        title,
        description,
        createdAt,
        assignees,
      } = props;

      const embedGithubId = this.host.service.addBlock(
        'affine:embed-github',
        {
          xywh,
          style,
          owner,
          repo,
          githubType,
          githubId,
          url,
          caption,
          image,
          status,
          statusReason,
          title,
          description,
          createdAt,
          assignees,
        },
        this.surface.model.id
      );
      return embedGithubId;
    });
    return embedGithubIds;
  }

  private _createYoutubeEmbedBlocks(youtubeEmbeds: BlockSnapshot[]) {
    const embedYoutubeIds = youtubeEmbeds.map(({ props }) => {
      const {
        xywh,
        style,
        url,
        caption,
        videoId,
        image,
        title,
        description,
        creator,
        creatorUrl,
        creatorImage,
      } = props;

      const embedYoutubeId = this.host.service.addBlock(
        'affine:embed-youtube',
        {
          xywh,
          style,
          url,
          caption,
          videoId,
          image,
          title,
          description,
          creator,
          creatorUrl,
          creatorImage,
        },
        this.surface.model.id
      );
      return embedYoutubeId;
    });
    return embedYoutubeIds;
  }

  private _createFigmaEmbedBlocks(figmaEmbeds: BlockSnapshot[]) {
    const embedFigmaIds = figmaEmbeds.map(({ props }) => {
      const { xywh, style, url, caption, title, description } = props;

      const embedFigmaId = this.host.service.addBlock(
        'affine:embed-figma',
        {
          xywh,
          style,
          url,
          caption,
          title,
          description,
        },
        this.surface.model.id
      );
      return embedFigmaId;
    });
    return embedFigmaIds;
  }

  private _createLinkedDocEmbedBlocks(linkedDocEmbeds: BlockSnapshot[]) {
    const embedLinkedDocIds = linkedDocEmbeds.map(({ props }) => {
      const { xywh, style, caption, pageId } = props;

      return this.host.service.addBlock(
        'affine:embed-linked-doc',
        {
          xywh,
          style,
          caption,
          pageId,
        },
        this.surface.model.id
      );
    });
    return embedLinkedDocIds;
  }

  private _createSyncedDocEmbedBlocks(syncedDocEmbeds: BlockSnapshot[]) {
    const embedSyncedDocIds = syncedDocEmbeds.map(({ props }) => {
      const { xywh, style, caption, scale, pageId } = props;

      return this.host.service.addBlock(
        'affine:embed-synced-doc',
        {
          xywh,
          style,
          caption,
          scale,
          pageId,
        },
        this.surface.model.id
      );
    });
    return embedSyncedDocIds;
  }

  private _createHtmlEmbedBlocks(htmlEmbeds: BlockSnapshot[]) {
    const embedHtmlIds = htmlEmbeds.map(({ props }) => {
      const { xywh, style, caption, html, design } = props;

      const embedHtmlId = this.host.service.addBlock(
        'affine:embed-html',
        {
          xywh,
          style,
          caption,
          html,
          design,
        },
        this.surface.model.id
      );
      return embedHtmlId;
    });
    return embedHtmlIds;
  }

  private _emitSelectionChangeAfterPaste(
    canvasElementIds: string[],
    blockIds: string[]
  ) {
    const newSelected = [
      ...canvasElementIds,
      ...blockIds.filter(id => {
        return isTopLevelBlock(this.page.getBlockById(id));
      }),
    ];

    this.selectionManager.set({
      editing: false,
      elements: newSelected,
    });
  }

  createElementsFromClipboardData(
    elementsRawData: Record<string, unknown>[],
    pasteCenter?: IVec
  ) {
    const groupedByType = groupBy(elementsRawData, data =>
      isNoteBlock(data as unknown as Selectable)
        ? 'notes'
        : isFrameBlock(data as unknown as Selectable)
          ? 'frames'
          : isImageBlock(data as unknown as Selectable)
            ? 'images'
            : isAttachmentBlock(data as unknown as Selectable)
              ? 'attachments'
              : isBookmarkBlock(data as unknown as Selectable)
                ? 'bookmarks'
                : isEmbedGithubBlock(data as unknown as Selectable)
                  ? 'githubEmbeds'
                  : isEmbedYoutubeBlock(data as unknown as Selectable)
                    ? 'youtubeEmbeds'
                    : isEmbedFigmaBlock(data as unknown as Selectable)
                      ? 'figmaEmbeds'
                      : isEmbedLinkedDocBlock(data as unknown as Selectable)
                        ? 'linkedDocEmbeds'
                        : isEmbedSyncedDocBlock(data as unknown as Selectable)
                          ? 'syncedDocEmbeds'
                          : isEmbedHtmlBlock(data as unknown as Selectable)
                            ? 'htmlEmbeds'
                            : 'elements'
    ) as unknown as {
      frames: BlockSnapshot[];
      notes?: BlockSnapshot[];
      images?: BlockSnapshot[];
      attachments?: BlockSnapshot[];
      bookmarks?: BlockSnapshot[];
      githubEmbeds?: BlockSnapshot[];
      youtubeEmbeds?: BlockSnapshot[];
      figmaEmbeds?: BlockSnapshot[];
      linkedDocEmbeds?: BlockSnapshot[];
      syncedDocEmbeds?: BlockSnapshot[];
      htmlEmbeds?: BlockSnapshot[];
      elements?: { type: CanvasElement['type'] }[];
    };
    pasteCenter =
      pasteCenter ??
      this.host.service.viewport.toModelCoord(
        this.toolManager.lastMousePos.x,
        this.toolManager.lastMousePos.y
      );
    // map old id to new id to rebuild connector's source and target
    const oldIdToNewIdMap = new Map<string, string>();

    // create and add blocks to page
    const noteIds = this._createNoteBlocks(
      groupedByType.notes || [],
      oldIdToNewIdMap
    );
    const frameIds = this._createFrameBlocks(groupedByType.frames ?? []);
    const imageIds = this._createImageBlocks(
      groupedByType.images ?? [],
      oldIdToNewIdMap
    );
    const attachmentIds = this._createAttachmentBlocks(
      groupedByType.attachments ?? []
    );
    const bookmarkIds = this._createBookmarkBlocks(
      groupedByType.bookmarks ?? []
    );
    const embedGithubIds = this._createGithubEmbedBlocks(
      groupedByType.githubEmbeds ?? []
    );
    const embedYoutubeIds = this._createYoutubeEmbedBlocks(
      groupedByType.youtubeEmbeds ?? []
    );
    const embedFigmaIds = this._createFigmaEmbedBlocks(
      groupedByType.figmaEmbeds ?? []
    );
    const embedLinkedDocIds = this._createLinkedDocEmbedBlocks(
      groupedByType.linkedDocEmbeds ?? []
    );
    const embedSyncedDocIds = this._createSyncedDocEmbedBlocks(
      groupedByType.syncedDocEmbeds ?? []
    );
    const embedHtmlIds = this._createHtmlEmbedBlocks(
      groupedByType.htmlEmbeds ?? []
    );

    const notes = noteIds.map(id =>
      this.page.getBlockById(id)
    ) as NoteBlockModel[];

    const frames = frameIds.map(id =>
      this.page.getBlockById(id)
    ) as FrameBlockModel[];

    const images = imageIds.map(id =>
      this.host.service.getElementById(id)
    ) as ImageBlockModel[];

    const attachments = attachmentIds.map(id =>
      this.host.service.getElementById(id)
    ) as AttachmentBlockModel[];

    const bookmarks = bookmarkIds.map(id =>
      this.host.service.getElementById(id)
    ) as BookmarkBlockModel[];

    const githubEmbeds = embedGithubIds.map(id =>
      this.host.service.getElementById(id)
    ) as EmbedGithubModel[];

    const youtubeEmbeds = embedYoutubeIds.map(id =>
      this.host.service.getElementById(id)
    ) as EmbedYoutubeModel[];

    const figmaEmbeds = embedFigmaIds.map(id =>
      this.host.service.getElementById(id)
    ) as EmbedFigmaModel[];

    const linkedDocEmbeds = embedLinkedDocIds.map(id =>
      this.host.service.getElementById(id)
    ) as EmbedLinkedDocModel[];

    const syncedDocEmbeds = embedSyncedDocIds.map(id =>
      this.host.service.getElementById(id)
    ) as EmbedSyncedDocModel[];

    const htmlEmbeds = embedHtmlIds.map(id =>
      this.host.service.getElementById(id)
    ) as EmbedHtmlModel[];

    const elements = this._createCanvasElements(
      groupedByType.elements || [],
      oldIdToNewIdMap
    );

    const [modelX, modelY] = pasteCenter;

    const oldCommonBound = edgelessElementsBound([
      ...elements,
      ...notes,
      ...frames,
      ...images,
      ...attachments,
      ...bookmarks,
      ...githubEmbeds,
      ...youtubeEmbeds,
      ...figmaEmbeds,
      ...linkedDocEmbeds,
      ...syncedDocEmbeds,
      ...htmlEmbeds,
    ]);
    const pasteX = modelX - oldCommonBound.w / 2;
    const pasteY = modelY - oldCommonBound.h / 2;

    // update canvas elements' position to mouse position
    elements.forEach(ele => {
      const newBound = new Bound(
        pasteX + ele.x - oldCommonBound.x,
        pasteY + ele.y - oldCommonBound.y,
        ele.w,
        ele.h
      );
      if (ele instanceof ConnectorElementModel) {
        ele.moveTo(newBound);
      } else {
        this.host.service.updateElement(ele.id, {
          xywh: newBound.serialize(),
        });
      }
    });

    const blocks = [
      ...notes,
      ...frames,
      ...images,
      ...attachments,
      ...bookmarks,
      ...githubEmbeds,
      ...youtubeEmbeds,
      ...figmaEmbeds,
      ...linkedDocEmbeds,
      ...syncedDocEmbeds,
      ...htmlEmbeds,
    ];
    blocks.forEach(block => {
      const bound = Bound.deserialize(block.xywh);

      bound.x += pasteX - oldCommonBound.x;
      bound.y += pasteY - oldCommonBound.y;
      this.edgeless.service.updateElement(block.id, {
        xywh: bound.serialize(),
      });
    });

    return [elements, blocks] as const;
  }

  private _pasteShapesAndBlocks(elementsRawData: Record<string, unknown>[]) {
    const [elements, blocks] =
      this.createElementsFromClipboardData(elementsRawData);
    this._emitSelectionChangeAfterPaste(
      elements.map(ele => ele.id),
      blocks.map(block => block.id)
    );
  }

  async toCanvas(blocks: TopLevelBlockModel[], shapes: CanvasElement[]) {
    blocks.sort(compare);
    shapes.sort(compare);

    const bounds: IBound[] = [];
    blocks.forEach(block => {
      bounds.push(Bound.deserialize(block.xywh));
    });
    shapes.forEach(shape => {
      bounds.push(Bound.deserialize(shape.xywh));
    });
    const bound = getCommonBound(bounds);
    assertExists(bound, 'bound not exist');

    const canvas = await this._edgelessToCanvas(
      this.host,
      bound,
      blocks,
      shapes
    );
    return canvas;
  }

  async copyAsPng(blocks: TopLevelBlockModel[], shapes: CanvasElement[]) {
    const blocksLen = blocks.length;
    const shapesLen = shapes.length;

    if (blocksLen + shapesLen === 0) return;
    const canvas = await this.toCanvas(blocks, shapes);
    assertExists(canvas);
    // @ts-ignore
    if (window.apis?.clipboard?.copyAsImageFromString) {
      // @ts-ignore
      await window.apis.clipboard?.copyAsImageFromString(
        canvas.toDataURL(IMAGE_PNG)
      );
    } else {
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject('Canvas can not export blob')),
          IMAGE_PNG
        )
      );
      assertExists(blob);

      this.std.clipboard
        .writeToClipboard(_items => {
          return {
            ..._items,
            [IMAGE_PNG]: blob,
          };
        })
        .catch(console.error);
    }
  }

  private async _replaceRichTextWithSvgElement(element: HTMLElement) {
    const richList = Array.from(element.querySelectorAll('.inline-editor'));
    await Promise.all(
      richList.map(rich => {
        const svgEle = this._elementToSvgElement(
          rich.cloneNode(true) as HTMLElement,
          rich.clientWidth,
          rich.clientHeight + 1
        );
        rich.parentElement?.appendChild(svgEle);
        rich.parentElement?.removeChild(rich);
      })
    );
  }

  private _elementToSvgElement(
    node: HTMLElement,
    width: number,
    height: number
  ) {
    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(xmlns, 'svg');
    const foreignObject = document.createElementNS(xmlns, 'foreignObject');

    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    foreignObject.setAttribute('width', '100%');
    foreignObject.setAttribute('height', '100%');
    foreignObject.setAttribute('x', '0');
    foreignObject.setAttribute('y', '0');
    foreignObject.setAttribute('externalResourcesRequired', 'true');

    svg.appendChild(foreignObject);
    foreignObject.appendChild(node);
    return svg;
  }

  private async _edgelessToCanvas(
    edgeless: EdgelessPageBlockComponent,
    bound: IBound,
    nodes?: TopLevelBlockModel[],
    canvasElements: CanvasElement[] = []
  ): Promise<HTMLCanvasElement | undefined> {
    const host = edgeless.host;
    const root = this.page.root;
    if (!root) return;

    const html2canvas = (await import('html2canvas')).default;
    if (!(html2canvas instanceof Function)) return;

    const pathname = location.pathname;
    const pageMode = isInsideDocEditor(host);

    const pageElement = getPageByEditorHost(host);
    assertExists(pageElement);
    const viewportElement = pageElement.viewportElement;

    const container = pageElement.querySelector(
      '.affine-block-children-container'
    );
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = (bound.w + 100) * dpr;
    canvas.height = (bound.h + 100) * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = window.getComputedStyle(container).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const replaceImgSrcWithSvg = this._exportManager.replaceImgSrcWithSvg;
    const replaceRichTextWithSvgElementFunc =
      this._replaceRichTextWithSvgElement.bind(this);

    // TODO: use image proxy endpoint middleware shared with image block
    let _imageProxyEndpoint: string | undefined;
    if (
      !_imageProxyEndpoint &&
      location.protocol === 'https:' &&
      location.hostname.split('.').includes('affine')
    ) {
      _imageProxyEndpoint = DEFAULT_IMAGE_PROXY_ENDPOINT;
    }

    const html2canvasOption = {
      ignoreElements: function (element: Element) {
        if (
          element.tagName === 'AFFINE-BLOCK-HUB' ||
          element.tagName === 'EDGELESS-TOOLBAR' ||
          element.classList.contains('dg')
        ) {
          return true;
        } else {
          return false;
        }
      },
      onclone: async function (documentClone: Document, element: HTMLElement) {
        // html2canvas can't support transform feature
        element.style.setProperty('transform', 'none');
        const layer = documentClone.querySelector('.affine-edgeless-layer');
        if (layer && layer instanceof HTMLElement) {
          layer.style.setProperty('transform', 'none');
        }

        const boxShadowEles = documentClone.querySelectorAll(
          "[style*='box-shadow']"
        );
        boxShadowEles.forEach(function (element) {
          if (element instanceof HTMLElement) {
            element.style.setProperty('box-shadow', 'none');
          }
        });
        await replaceImgSrcWithSvg(element);
        await replaceRichTextWithSvgElementFunc(element);
      },
      backgroundColor: window.getComputedStyle(viewportElement).backgroundColor,
      useCORS: _imageProxyEndpoint ? false : true,
      proxy: _imageProxyEndpoint,
    };

    const _drawTopLevelBlock = async (
      block: TopLevelBlockModel,
      isInFrame = false
    ) => {
      let blockElement = blockElementGetter(
        block,
        this.std.view
      )?.parentElement;
      const blockPortalSelector = block.flavour.replace(
        'affine:',
        '.edgeless-block-portal-'
      );
      blockElement = blockElement?.closest(blockPortalSelector);
      if (!blockElement) {
        throw new Error('Could not find edgeless block portal.');
      }

      const blockBound = Bound.deserialize(block.xywh);
      const canvasData = await html2canvas(
        blockElement as HTMLElement,
        html2canvasOption
      );
      ctx.drawImage(
        canvasData,
        blockBound.x - bound.x + 50,
        blockBound.y - bound.y + 50,
        blockBound.w,
        isInFrame
          ? (blockBound.w / canvasData.width) * canvasData.height
          : blockBound.h
      );
    };

    const nodeElements =
      nodes ??
      (edgeless.service.pickElementsByBound(
        bound,
        'blocks'
      ) as TopLevelBlockModel[]);
    for (const nodeElement of nodeElements) {
      await _drawTopLevelBlock(nodeElement);

      if (matchFlavours(nodeElement, ['affine:frame'])) {
        const blocksInsideFrame: TopLevelBlockModel[] = [];
        this.edgeless.service.frame
          .getElementsInFrame(nodeElement, false)
          .forEach(ele => {
            if (isTopLevelBlock(ele)) {
              blocksInsideFrame.push(ele as TopLevelBlockModel);
            } else {
              canvasElements.push(ele as CanvasElement);
            }
          });

        for (let i = 0; i < blocksInsideFrame.length; i++) {
          const element = blocksInsideFrame[i];
          await _drawTopLevelBlock(element, true);
        }
      }

      this._checkCanContinueToCanvas(host, pathname, pageMode);
    }

    const surfaceCanvas = edgeless.surface.renderer.getCanvasByBound(
      bound,
      canvasElements
    );
    ctx.drawImage(surfaceCanvas, 50, 50, bound.w, bound.h);

    return canvas;
  }

  private _checkCanContinueToCanvas(
    host: EditorHost,
    pathName: string,
    pageMode: boolean
  ) {
    if (
      location.pathname !== pathName ||
      isInsideDocEditor(host) !== pageMode
    ) {
      throw new Error('Unable to export content to canvas');
    }
  }
}

export function getCopyElements(
  surface: SurfaceBlockComponent,
  elements: EdgelessModel[]
) {
  const set = new Set<EdgelessModel>();

  elements.forEach(element => {
    if (isFrameBlock(element)) {
      set.add(element);
      surface.edgeless.service.frame
        .getElementsInFrame(element)
        .forEach(ele => set.add(ele));
    } else if (element instanceof GroupElementModel) {
      getCopyElements(
        surface,
        (element as GroupElementModel).childElements
      ).forEach(ele => set.add(ele));
      set.add(element);
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}

function prepareConnectorClipboardData(
  connector: ConnectorElementModel,
  selected: Selectable[]
) {
  const sourceId = connector.source?.id;
  const targetId = connector.target?.id;
  const serialized = connector.serialize();
  if (sourceId && !selected.find(s => s.id === sourceId)) {
    serialized.source = { position: connector.absolutePath[0] };
  }
  if (targetId && !selected.find(s => s.id === targetId)) {
    serialized.target = {
      position: connector.absolutePath[connector.absolutePath.length - 1],
    };
  }
  return serialized;
}

export async function prepareClipboardData(
  selectedAll: Selectable[],
  std: BlockStdScope
) {
  const selected = await Promise.all(
    selectedAll.map(async selected => {
      const job = new Job({
        workspace: std.workspace,
      });

      if (isNoteBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isFrameBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isImageBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isAttachmentBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isBookmarkBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isEmbedGithubBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isEmbedYoutubeBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isEmbedFigmaBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isEmbedLinkedDocBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isEmbedHtmlBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (isEmbedSyncedDocBlock(selected)) {
        const snapshot = await job.blockToSnapshot(selected);
        return { ...snapshot };
      } else if (selected instanceof ConnectorElementModel) {
        return prepareConnectorClipboardData(selected, selectedAll);
      } else {
        return (selected as ElementModel).serialize();
      }
    })
  );
  return selected.filter(d => !!d);
}

function isPureFileInClipboard(clipboardData: DataTransfer) {
  const types = clipboardData.types;
  return (
    (types.length === 1 && types[0] === 'Files') ||
    (types.length === 2 &&
      (types.includes('text/plain') || types.includes('text/html')) &&
      types.includes('Files'))
  );
}
