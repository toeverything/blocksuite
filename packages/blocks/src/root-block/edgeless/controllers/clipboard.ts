import type {
  BlockStdScope,
  SurfaceSelection,
  UIEventStateContext,
} from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';
import type { IBound } from '@blocksuite/global/utils';

import { Vec } from '@blocksuite/global/utils';
import { Bound } from '@blocksuite/global/utils';
import {
  DisposableGroup,
  assertExists,
  assertInstanceOf,
} from '@blocksuite/global/utils';
import {
  type BlockSnapshot,
  BlockSnapshotSchema,
  DocCollection,
  Job,
  type SliceSnapshot,
  fromJSON,
} from '@blocksuite/store';
import DOMPurify from 'dompurify';

import type { EdgelessSelectableProps } from '../../../_common/edgeless/mixin/edgeless-selectable.js';
import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';

import {
  CANVAS_EXPORT_IGNORE_TAGS,
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../../../_common/consts.js';
import { matchFlavours } from '../../../_common/utils/index.js';
import { groupBy } from '../../../_common/utils/iterable.js';
import {
  blockComponentGetter,
  getRootByEditorHost,
  isInsidePageEditor,
} from '../../../_common/utils/query.js';
import { isUrlInClipboard } from '../../../_common/utils/url.js';
import { BookmarkStyles } from '../../../bookmark-block/bookmark-model.js';
import { EdgelessTextBlockModel } from '../../../edgeless-text/edgeless-text-model.js';
import {
  type SerializedElement,
  SurfaceGroupLikeModel,
} from '../../../surface-block/element-model/base.js';
import { CanvasElementType } from '../../../surface-block/element-model/index.js';
import { splitIntoLines } from '../../../surface-block/elements/text/utils.js';
import {
  type Connection,
  getBoundsWithRotation,
} from '../../../surface-block/index.js';
import { ConnectorElementModel } from '../../../surface-block/index.js';
import { compare } from '../../../surface-block/managers/layer-utils.js';
import { getCommonBound } from '../../../surface-block/utils/bound.js';
import { ClipboardAdapter } from '../../clipboard/adapter.js';
import { PageClipboard } from '../../clipboard/index.js';
import {
  decodeClipboardBlobs,
  encodeClipboardBlobs,
} from '../../clipboard/utils.js';
import { edgelessElementsBound } from '../utils/bound-utils.js';
import { getCloneElements, serializeElement } from '../utils/clone-utils.js';
import { DEFAULT_NOTE_HEIGHT, DEFAULT_NOTE_WIDTH } from '../utils/consts.js';
import { deleteElements } from '../utils/crud.js';
import {
  isAttachmentBlock,
  isCanvasElementWithText,
  isImageBlock,
  isTopLevelBlock,
} from '../utils/query.js';

const BLOCKSUITE_SURFACE = 'blocksuite/surface';
const IMAGE_PNG = 'image/png';

const { GROUP, MINDMAP } = CanvasElementType;
const IMAGE_PADDING = 5; // for rotated shapes some padding is needed

interface CanvasExportOptions {
  dpr?: number;
  padding?: number;
  background?: string;
}

export class EdgelessClipboardController extends PageClipboard {
  private _initEdgelessClipboard = () => {
    this.host.handleEvent(
      'copy',
      ctx => {
        const { surfaceSelections, selectedIds } = this.selectionManager;

        if (selectedIds.length === 0) return false;

        this._onCopy(ctx, surfaceSelections);
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

    const elements = getCloneElements(
      this.selectionManager.selectedElements,
      this.surface.edgeless.service.frame
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

  private _onCut = (_context: UIEventStateContext) => {
    const { surfaceSelections, selectedElements } = this.selectionManager;

    if (selectedElements.length === 0) return;

    const event = _context.get('clipboardState').event;
    event.preventDefault();

    this._onCopy(_context, surfaceSelections);

    if (surfaceSelections[0]?.editing) {
      // use build-in cut handler in rich-text when cut in surface text element
      if (isCanvasElementWithText(selectedElements[0])) return;
      this.onPageCut(_context);
      return;
    }

    const elements = getCloneElements(
      this.selectionManager.selectedElements,
      this.surface.edgeless.service.frame
    );
    this.doc.transact(() => {
      deleteElements(this.surface, elements);
    });

    this.selectionManager.set({
      editing: false,
      elements: [],
    });
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

    const { surfaceSelections, selectedElements } = this.selectionManager;

    if (surfaceSelections[0]?.editing) {
      // use build-in paste handler in rich-text when paste in surface text element
      if (isCanvasElementWithText(selectedElements[0])) return;
      this.onPagePaste(_context);
      return;
    }

    const data = event.clipboardData;
    if (!data) return;

    const { lastMousePos } = this.toolManager;
    const point: IVec = [lastMousePos.x, lastMousePos.y];

    if (isPureFileInClipboard(data)) {
      const files = data.files;
      if (files.length === 0) return;

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

      this._rootService.telemetryService?.track('CanvasElementAdded', {
        control: 'canvas:paste',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: attachmentFiles.length === 0 ? 'image' : 'attachment',
      });

      return;
    }

    if (isUrlInClipboard(data)) {
      const url = data.getData('text/plain');
      const { lastMousePos } = this.toolManager;
      const [x, y] = this.host.service.viewport.toModelCoord(
        lastMousePos.x,
        lastMousePos.y
      );

      // try interpret url as affine doc url
      const doc = await this._rootService.quickSearchService?.searchDoc({
        action: 'insert',
        userInput: url,
        skipSelection: true,
      });
      const pageId = doc && 'docId' in doc ? doc.docId : undefined;

      const embedOptions = this._rootService.getEmbedBlockOptions(url);
      const flavour = pageId
        ? 'affine:embed-linked-doc'
        : embedOptions
          ? (embedOptions.flavour as BlockSuite.EdgelessModelKeys)
          : 'affine:bookmark';
      const style = pageId
        ? 'vertical'
        : embedOptions
          ? embedOptions.styles[0]
          : BookmarkStyles[0];
      const width = EMBED_CARD_WIDTH[style];
      const height = EMBED_CARD_HEIGHT[style];

      const options: Record<string, unknown> = {
        xywh: Bound.fromCenter(
          Vec.toVec({
            x,
            y,
          }),
          width,
          height
        ).serialize(),
        style,
      };

      if (pageId) {
        options.pageId = pageId;
      } else {
        options.url = url;
      }

      const id = this.host.service.addBlock(
        flavour,
        options,
        this.surface.model.id
      );

      this._rootService.telemetryService?.track('CanvasElementAdded', {
        control: 'canvas:paste',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: flavour.split(':')[1],
      });

      this._rootService.telemetryService?.track('LinkedDocCreated', {
        page: 'whiteboard editor',
        segment: 'whiteboard',
        category: 'pasted link',
        other: 'existing doc',
      });

      this.selectionManager.set({
        editing: false,
        elements: [id],
      });

      return;
    }

    const svg = tryGetSvgFromClipboard(data);
    if (svg) {
      await this.host.addImages([svg], point);
      return;
    }
    try {
      // check for surface elements in clipboard
      const json = this.std.clipboard.readFromClipboard(data);
      const mayBeSurfaceDataJson = json[BLOCKSUITE_SURFACE];
      if (mayBeSurfaceDataJson !== undefined) {
        const elementsRawData = JSON.parse(mayBeSurfaceDataJson);
        const { snapshot, blobs } = elementsRawData;
        const job = new Job({ collection: this.std.collection });
        const map = job.assetsManager.getAssets();
        decodeClipboardBlobs(blobs, map);
        for (const blobId of map.keys()) {
          await job.assetsManager.writeToBlob(blobId);
        }
        await this._pasteShapesAndBlocks(snapshot);
        return;
      }
      // check for slice snapshot in clipboard
      const mayBeSliceDataJson = json[ClipboardAdapter.MIME];
      if (mayBeSliceDataJson === undefined) return;
      const clipData = JSON.parse(mayBeSliceDataJson);
      const sliceSnapShot = clipData?.snapshot as SliceSnapshot;
      this._pasteTextContentAsNote(sliceSnapShot.content);
    } catch (_) {
      // if it is not parsable
      this._pasteTextContentAsNote(data.getData('text/plain'));
    }
  };

  constructor(public override host: EdgelessRootBlockComponent) {
    super(host);
  }

  private _checkCanContinueToCanvas(
    host: EditorHost,
    pathName: string,
    editorMode: boolean
  ) {
    if (
      location.pathname !== pathName ||
      isInsidePageEditor(host) !== editorMode
    ) {
      throw new Error('Unable to export content to canvas');
    }
  }

  private async _createAttachmentBlocks(attachments: BlockSnapshot[]) {
    const attachmentIds = [];
    for (const { props } of attachments) {
      const { xywh, rotate, sourceId, name, size, type, embed, style } = props;
      if (!(await this.host.std.collection.blobSync.get(sourceId as string))) {
        continue;
      }
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
      attachmentIds.push(attachmentId);
    }
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

  private _createCanvasElement(
    clipboardData: Record<string, unknown>,
    idMap: Map<string, string>
  ) {
    if (clipboardData.type === GROUP) {
      const yMap = new DocCollection.Y.Map();
      const children = clipboardData.children ?? {};
      for (const [key, value] of Object.entries(children)) {
        const newKey = idMap.get(key);
        assertExists(newKey);
        yMap.set(newKey, value);
      }
      clipboardData.children = yMap;
    }

    if (clipboardData.type === MINDMAP) {
      const yMap = new DocCollection.Y.Map();
      const children = clipboardData.children ?? {};
      for (const [key, value] of Object.entries(children)) {
        const newKey = idMap.get(key);
        assertExists(newKey);

        if (value.parent) {
          const newParent = idMap.get(value.parent);
          assertExists(newParent);
          value.parent = newParent;
        }

        yMap.set(newKey, value);
      }
      clipboardData.children = yMap;
    }

    const id = this.host.service.addElement(
      clipboardData.type as CanvasElementType,
      clipboardData
    );
    this.host.service.telemetryService?.track('CanvasElementAdded', {
      control: 'canvas:paste',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: clipboardData.type as string,
    });
    const element = this.host.service.getElementById(
      id
    ) as BlockSuite.SurfaceModel;
    assertExists(element);
    return element;
  }

  private _createCanvasElements(
    elements: SerializedElement[],
    idMap: Map<string, string>
  ) {
    const result = groupBy(elements, item => {
      switch (item.type) {
        case 'connector':
          return 'connectors';
        case 'group':
          return 'groups';
        case 'mindmap':
          return 'mindmaps';
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
        const oldId = connector.id as string;
        const sourceId = (connector.source as Connection).id;
        if (sourceId) {
          (connector.source as Connection).id =
            idMap.get(sourceId) ?? (sourceId as string);
        }
        const targetId = (connector.target as Connection).id;
        if (targetId) {
          (connector.target as Connection).id =
            idMap.get(targetId) ?? (targetId as string);
        }
        const element = this._createCanvasElement(connector, idMap);
        idMap.set(oldId, element.id);
        return element;
      }) ?? []),

      ...(result.groups?.map(group => {
        const oldId = group.id as string;
        assertExists(oldId);
        const element = this._createCanvasElement(group, idMap);
        idMap.set(oldId, element.id);
        return element;
      }) ?? []),

      ...(result.mindmaps?.map(mindmap => {
        const oldId = mindmap.id as string;
        assertExists(oldId);
        const element = this._createCanvasElement(mindmap, idMap);
        idMap.set(oldId, element.id);
        return element;
      }) ?? []),
    ];
  }

  private _createEdgelessTextBlocks(
    edgelessTexts: BlockSnapshot[],
    oldToNewIdMap: Map<string, string>
  ) {
    const { host } = this;
    const edgelessTextIds = edgelessTexts.map(({ id, props, children }) => {
      delete props.index;
      assertExists(props.xywh);
      const textId = host.service.addBlock(
        'affine:edgeless-text',
        props,
        this.edgeless.surface.model.id
      );
      const text = host.service.getElementById(textId);
      oldToNewIdMap.set(id, textId);
      assertInstanceOf(text, EdgelessTextBlockModel);

      children.forEach((child, index) => {
        this.onBlockSnapshotPaste(child, this.doc, text.id, index);
      });
      return textId;
    });
    return edgelessTextIds;
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

  private async _createImageBlocks(
    images: BlockSnapshot[],
    oldToNewIdMap: Map<string, string>
  ) {
    const imageIds = [];
    for (const { props, id } of images) {
      const { xywh, rotate, sourceId, size, width, height, caption } = props;
      if (!(await this.host.std.collection.blobSync.get(sourceId as string))) {
        continue;
      }
      const imageId = this.host.service.addBlock(
        'affine:image',
        {
          caption,
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
      imageIds.push(imageId);
    }
    return imageIds;
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

  private _createLoomEmbedBlocks(loomEmbeds: BlockSnapshot[]) {
    const embedLoomIds = loomEmbeds.map(({ props }) => {
      const { xywh, style, url, caption, videoId, image, title, description } =
        props;

      const embedLoomId = this.host.service.addBlock(
        'affine:embed-loom',
        {
          xywh,
          style,
          url,
          caption,
          videoId,
          image,
          title,
          description,
        },
        this.surface.model.id
      );
      return embedLoomId;
    });
    return embedLoomIds;
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
        this.doc.root!.id
      );
      const note = host.service.getElementById(noteId) as NoteBlockModel;
      if (id) oldToNewIdMap.set(id, noteId);
      assertExists(note);

      children.forEach((child, index) => {
        this.onBlockSnapshotPaste(child, this.doc, note.id, index);
      });
      return noteId;
    });
    return noteIds;
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

  private async _edgelessToCanvas(
    edgeless: EdgelessRootBlockComponent,
    bound: IBound,
    nodes?: BlockSuite.EdgelessBlockModelType[],
    canvasElements: BlockSuite.SurfaceModel[] = [],
    {
      background,
      padding = IMAGE_PADDING,
      dpr = window.devicePixelRatio || 1,
    }: CanvasExportOptions = {}
  ): Promise<HTMLCanvasElement | undefined> {
    const host = edgeless.host;
    const rootModel = this.doc.root;
    if (!rootModel) return;

    const html2canvas = (await import('html2canvas')).default;
    if (!(html2canvas instanceof Function)) return;

    const pathname = location.pathname;
    const editorMode = isInsidePageEditor(host);

    const rootComponent = getRootByEditorHost(host);
    assertExists(rootComponent);

    const container = rootComponent.querySelector(
      '.affine-block-children-container'
    );
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = (bound.w + padding * 2) * dpr;
    canvas.height = (bound.h + padding * 2) * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(dpr, dpr);

    const replaceImgSrcWithSvg = this._exportManager.replaceImgSrcWithSvg;
    const replaceRichTextWithSvgElementFunc =
      this._replaceRichTextWithSvgElement.bind(this);

    const imageProxy = host.std.clipboard.configs.get('imageProxy');
    const html2canvasOption = {
      ignoreElements: function (element: Element) {
        if (
          CANVAS_EXPORT_IGNORE_TAGS.includes(element.tagName) ||
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

        const boxShadowElements = documentClone.querySelectorAll(
          "[style*='box-shadow']"
        );
        boxShadowElements.forEach(function (element) {
          if (element instanceof HTMLElement) {
            element.style.setProperty('box-shadow', 'none');
          }
        });
        await replaceImgSrcWithSvg(element);
        await replaceRichTextWithSvgElementFunc(element);
      },
      backgroundColor: 'transparent',
      useCORS: imageProxy ? false : true,
      proxy: imageProxy,
    };

    const _drawTopLevelBlock = async (
      block: BlockSuite.EdgelessBlockModelType,
      isInFrame = false
    ) => {
      let blockComponent = blockComponentGetter(
        block,
        this.std.view
      )?.parentElement;
      const blockPortalSelector = block.flavour.replace(
        'affine:',
        '.edgeless-block-portal-'
      );
      blockComponent = blockComponent?.closest(blockPortalSelector);
      if (!blockComponent) {
        throw new Error('Could not find edgeless block portal.');
      }

      const blockBound = Bound.deserialize(block.xywh);
      const canvasData = await html2canvas(
        blockComponent as HTMLElement,
        html2canvasOption
      );
      ctx.drawImage(
        canvasData,
        blockBound.x - bound.x + padding,
        blockBound.y - bound.y + padding,
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
      ) as BlockSuite.EdgelessBlockModelType[]);
    for (const nodeElement of nodeElements) {
      await _drawTopLevelBlock(nodeElement);

      if (matchFlavours(nodeElement, ['affine:frame'])) {
        const blocksInsideFrame: BlockSuite.EdgelessBlockModelType[] = [];
        this.edgeless.service.frame
          .getElementsInFrame(nodeElement, false)
          .forEach(ele => {
            if (isTopLevelBlock(ele)) {
              blocksInsideFrame.push(ele as BlockSuite.EdgelessBlockModelType);
            } else {
              canvasElements.push(ele as BlockSuite.SurfaceModel);
            }
          });

        for (let i = 0; i < blocksInsideFrame.length; i++) {
          const element = blocksInsideFrame[i];
          await _drawTopLevelBlock(element, true);
        }
      }

      this._checkCanContinueToCanvas(host, pathname, editorMode);
    }

    const surfaceCanvas = edgeless.surface.renderer.getCanvasByBound(
      bound,
      canvasElements
    );
    ctx.drawImage(surfaceCanvas, padding, padding, bound.w, bound.h);

    return canvas;
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

    svg.append(foreignObject);
    foreignObject.append(node);
    return svg;
  }

  private _emitSelectionChangeAfterPaste(
    canvasElementIds: string[],
    blockIds: string[]
  ) {
    const newSelected = [
      ...canvasElementIds,
      ...blockIds.filter(id => {
        return isTopLevelBlock(this.doc.getBlockById(id));
      }),
    ];

    this.selectionManager.set({
      editing: false,
      elements: newSelected,
    });
  }

  private get _exportManager() {
    return this._rootService.exportManager;
  }

  private async _pasteShapesAndBlocks(
    elementsRawData: (SerializedElement | BlockSnapshot)[]
  ) {
    const { canvasElements, blockModels } =
      await this.createElementsFromClipboardData(elementsRawData);
    this._emitSelectionChangeAfterPaste(
      canvasElements.map(ele => ele.id),
      blockModels.map(block => block.id)
    );
  }

  private _pasteTextContentAsNote(content: BlockSnapshot[] | string) {
    const edgeless = this.host;
    const { lastMousePos } = this.toolManager;
    const [x, y] = edgeless.service.viewport.toModelCoord(
      lastMousePos.x,
      lastMousePos.y
    );

    const noteProps = {
      xywh: new Bound(
        x,
        y,
        DEFAULT_NOTE_WIDTH,
        DEFAULT_NOTE_HEIGHT
      ).serialize(),
    };

    const noteId = edgeless.service.addBlock(
      'affine:note',
      noteProps,
      this.doc.root!.id
    );

    edgeless.service.telemetryService?.track('CanvasElementAdded', {
      control: 'canvas:paste',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: 'note',
    });

    if (typeof content === 'string') {
      splitIntoLines(content).forEach((line, idx) => {
        edgeless.service.addBlock(
          'affine:paragraph',
          { text: new DocCollection.Y.Text(line) },
          noteId,
          idx
        );
      });
    } else {
      content.forEach((child, idx) => {
        this.onBlockSnapshotPaste(child, this.doc, noteId, idx);
      });
    }

    edgeless.service.selection.set({
      elements: [noteId],
      editing: false,
    });
    edgeless.tools.setEdgelessTool({ type: 'default' });
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
        rich.parentElement?.append(svgEle);
        rich.remove();
      })
    );
  }

  private get _rootService() {
    return this.std.spec.getService('affine:page');
  }

  private _updatePastedElementsIndex(
    elements: BlockSuite.EdgelessModel[],
    originalIndexes: Map<string, string>
  ) {
    function compare(a: BlockSuite.EdgelessModel, b: BlockSuite.EdgelessModel) {
      if (a instanceof SurfaceGroupLikeModel && a.hasDescendant(b)) {
        return -1;
      } else if (b instanceof SurfaceGroupLikeModel && b.hasDescendant(a)) {
        return 1;
      } else {
        const aGroups = a.groups as BlockSuite.SurfaceGroupLikeModel[];
        const bGroups = b.groups as BlockSuite.SurfaceGroupLikeModel[];
        const minGroups = Math.min(aGroups.length, bGroups.length);

        for (let i = 0; i < minGroups; ++i) {
          if (aGroups[i] !== bGroups[i]) {
            const aGroup = aGroups[i] ?? a;
            const bGroup = bGroups[i] ?? b;

            return aGroup.index === bGroup.index
              ? 0
              : aGroup.index < bGroup.index
                ? -1
                : 1;
          }
        }

        if (originalIndexes.get(a.id)! < originalIndexes.get(b.id)!) return -1;
        else if (originalIndexes.get(a.id)! > originalIndexes.get(b.id)!)
          return 1;
        return 0;
      }
    }

    const idxGenerator = this.edgeless.service.layer.createIndexGenerator(true);
    const sortedElements = elements.sort(compare);
    sortedElements.forEach(ele => {
      this.edgeless.service.updateElement(ele.id, {
        index: idxGenerator(isTopLevelBlock(ele) ? ele.flavour : ele.type),
      });
    });
  }

  private get doc() {
    return this.host.doc;
  }

  private get edgeless() {
    return this.surface.edgeless;
  }

  private get selectionManager() {
    return this.host.service.selection;
  }

  private get std() {
    return this.host.std;
  }

  private get surface() {
    return this.host.surface;
  }

  private get toolManager() {
    return this.host.tools;
  }

  copy() {
    document.dispatchEvent(
      new Event('copy', {
        bubbles: true,
        cancelable: true,
      })
    );
  }

  async copyAsPng(
    blocks: BlockSuite.EdgelessBlockModelType[],
    shapes: BlockSuite.SurfaceModel[]
  ) {
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

  async createElementsFromClipboardData(
    elementsRawData: (SerializedElement | BlockSnapshot)[],
    pasteCenter?: IVec
  ) {
    const originalIndexes = new Map<string, string>();
    const blockRawData: BlockSnapshot[] = [];
    const surfaceRawData: SerializedElement[] = [];

    elementsRawData.forEach(data => {
      const { data: blockSnapshot } = BlockSnapshotSchema.safeParse(data);
      if (blockSnapshot) {
        const props = blockSnapshot.props as EdgelessSelectableProps;
        originalIndexes.set(blockSnapshot.id, props.index);

        blockRawData.push(blockSnapshot);
      } else {
        const element = data as SerializedElement;
        originalIndexes.set(element.id, element.index);

        surfaceRawData.push(element);
      }
    });

    const noteSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:note'
    );
    const edgelessTextSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:edgeless-text'
    );
    const imageSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:image'
    );
    const frameSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:frame'
    );
    const attachmentSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:attachment'
    );
    const bookmarkSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:bookmark'
    );
    const embedGithubSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:embed-github'
    );
    const embedYoutubeSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:embed-youtube'
    );
    const embedFigmaSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:embed-figma'
    );
    const embedLinkedDocSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:embed-linked-doc'
    );
    const embedSyncedDocSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:embed-synced-doc'
    );
    const embedHtmlSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:embed-html'
    );
    const embedLoomSnapshots = blockRawData.filter(
      data => data.flavour === 'affine:embed-loom'
    );

    // map old id to new id to rebuild connector's source and target
    const oldIdToNewIdMap = new Map<string, string>();

    const noteIds = this._createNoteBlocks(noteSnapshots, oldIdToNewIdMap);
    const edgelessTextIds = this._createEdgelessTextBlocks(
      edgelessTextSnapshots,
      oldIdToNewIdMap
    );
    const imageIds = await this._createImageBlocks(
      imageSnapshots,
      oldIdToNewIdMap
    );
    const frameIds = this._createFrameBlocks(frameSnapshots);
    const attachmentIds =
      await this._createAttachmentBlocks(attachmentSnapshots);
    const bookmarkIds = this._createBookmarkBlocks(bookmarkSnapshots);
    const embedGithubIds = this._createGithubEmbedBlocks(embedGithubSnapshots);
    const embedYoutubeIds = this._createYoutubeEmbedBlocks(
      embedYoutubeSnapshots
    );
    const embedFigmaIds = this._createFigmaEmbedBlocks(embedFigmaSnapshots);
    const embedLinkedDocIds = this._createLinkedDocEmbedBlocks(
      embedLinkedDocSnapshots
    );
    const embedSyncedDocIds = this._createSyncedDocEmbedBlocks(
      embedSyncedDocSnapshots
    );
    const embedHtmlIds = this._createHtmlEmbedBlocks(embedHtmlSnapshots);
    const embedLoomIds = this._createLoomEmbedBlocks(embedLoomSnapshots);

    const blockModels = [
      ...noteIds,
      ...edgelessTextIds,
      ...frameIds,
      ...imageIds,
      ...attachmentIds,
      ...bookmarkIds,
      ...embedGithubIds,
      ...embedYoutubeIds,
      ...embedFigmaIds,
      ...embedLinkedDocIds,
      ...embedSyncedDocIds,
      ...embedHtmlIds,
      ...embedLoomIds,
    ].flatMap(
      id => this.host.doc.getBlock(id)?.model ?? []
    ) as BlockSuite.EdgelessBlockModelType[];
    const canvasElements = this._createCanvasElements(
      surfaceRawData,
      oldIdToNewIdMap
    );
    const allElements = [...blockModels, ...canvasElements];

    const { lastMousePos } = this.toolManager;
    pasteCenter =
      pasteCenter ??
      this.host.service.viewport.toModelCoord(lastMousePos.x, lastMousePos.y);
    const [modelX, modelY] = pasteCenter;
    const oldCommonBound = edgelessElementsBound(allElements);
    const pasteX = modelX - oldCommonBound.w / 2;
    const pasteY = modelY - oldCommonBound.h / 2;

    blockModels.forEach(block => {
      const bound = Bound.deserialize(block.xywh);

      bound.x += pasteX - oldCommonBound.x;
      bound.y += pasteY - oldCommonBound.y;
      this.edgeless.service.updateElement(block.id, {
        xywh: bound.serialize(),
      });
    });

    canvasElements.forEach(ele => {
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

    originalIndexes.forEach((index, id) => {
      const newId = oldIdToNewIdMap.get(id);
      if (newId) {
        originalIndexes.set(newId, index);
      }
    });

    this._updatePastedElementsIndex(allElements, originalIndexes);

    return {
      canvasElements,
      blockModels,
    };
  }

  override hostConnected() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }
    this._init();
    this._initEdgelessClipboard();
  }

  async toCanvas(
    blocks: BlockSuite.EdgelessBlockModelType[],
    shapes: BlockSuite.SurfaceModel[],
    options?: CanvasExportOptions
  ) {
    blocks.sort(compare);
    shapes.sort(compare);

    const bounds: IBound[] = [];
    blocks.forEach(block => {
      bounds.push(Bound.deserialize(block.xywh));
    });
    shapes.forEach(shape => {
      bounds.push(getBoundsWithRotation(shape.elementBound));
    });
    const bound = getCommonBound(bounds);
    assertExists(bound, 'bound not exist');

    const canvas = await this._edgelessToCanvas(
      this.host,
      bound,
      blocks,
      shapes,
      options
    );
    return canvas;
  }
}

export async function prepareClipboardData(
  selectedAll: BlockSuite.EdgelessModel[],
  std: BlockStdScope
) {
  const job = new Job({
    collection: std.collection,
  });
  const selected = await Promise.all(
    selectedAll.map(async selected => {
      const data = await serializeElement(selected, selectedAll, job);
      if (!data) {
        return;
      }
      if (isAttachmentBlock(selected) || isImageBlock(selected)) {
        await job.assetsManager.readFromBlob(data.props.sourceId as string);
      }
      return data;
    })
  );
  const blobs = await encodeClipboardBlobs(job.assetsManager.getAssets());
  return {
    snapshot: selected.filter(d => !!d),
    blobs,
  };
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

function tryGetSvgFromClipboard(clipboardData: DataTransfer) {
  const types = clipboardData.types;

  if (types.length === 1 && types[0] !== 'text/plain') {
    return null;
  }

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(
    clipboardData.getData('text/plain'),
    'image/svg+xml'
  );
  const svg = svgDoc.documentElement;

  if (svg.tagName !== 'svg' || !svg.hasAttribute('xmlns')) {
    return null;
  }
  const svgContent = DOMPurify.sanitize(svgDoc.documentElement, {
    USE_PROFILES: { svg: true },
  });
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const file = new File([blob], 'pasted-image.svg', { type: 'image/svg+xml' });
  return file;
}
