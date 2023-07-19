import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';

import {
  asyncFocusRichText,
  type BlockComponentElement,
  calcDropTarget,
  type DropResult,
  getClosestBlockElementByPoint,
  getClosestNoteBlockElementById,
  getLastNoteBlockElement,
  getModelByBlockElement,
  Point,
} from '../__internal__/index.js';
import type {
  DefaultPageBlockComponent,
  EdgelessPageBlockComponent,
  ImageBlockModel,
  NoteBlockComponent,
} from '../index.js';
import type { DragIndicator } from './index.js';

export type GetPageInfo = () => {
  page: Page;
  mode: 'page' | 'edgeless';
  pageBlock: DefaultPageBlockComponent | EdgelessPageBlockComponent | undefined;
};

type ImportHandler = (file: File) => Promise<Partial<BaseBlockModel> | void>;

export class FileDropManager {
  private _getPageInfo: GetPageInfo;
  private _indicator!: DragIndicator;
  private _point: Point | null = null;
  private _result: DropResult | null = null;
  private _handlers: Map<string, ImportHandler> = new Map();

  constructor(getPageInfo: GetPageInfo) {
    this._getPageInfo = getPageInfo;
    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
    if (!this._indicator) {
      this._indicator = <DragIndicator>(
        document.createElement('affine-drag-indicator')
      );
      document.body.appendChild(this._indicator);
    }
  }

  onDragOver = (event: DragEvent) => {
    event.preventDefault();

    // allow only external drag-and-drop files
    const effectAllowed = event.dataTransfer?.effectAllowed ?? 'none';
    if (effectAllowed !== 'all') return;

    const { clientX, clientY } = event;
    const point = new Point(clientX, clientY);
    const element = getClosestBlockElementByPoint(point.clone());

    let result = null;
    let rect = null;
    if (element) {
      const model = getModelByBlockElement(element);
      // TODO: Currently only picture types are supported, `affine:image`
      result = calcDropTarget(point, model, element, [], 1, 'affine:image');
      if (result) {
        rect = result.rect;
      }
    }

    this._result = result;
    this._indicator.rect = rect;
  };

  onDrop = async (event: DragEvent) => {
    event.preventDefault();

    const files = event.dataTransfer?.files;
    if (!files || !files.length) {
      this._result = null;
      this._indicator.rect = null;
      return;
    }

    const { clientX, clientY } = event;
    this._point = new Point(clientX, clientY);

    const blocks = [];
    const len = files.length;
    let i = 0;

    for (; i < len; i++) {
      const file = files[i];
      const handler = this.get(file.type);

      if (!handler) {
        console.warn(`This ${file.type} is not currently supported.`);
        continue;
      }

      const block = await handler(file);
      if (block) blocks.push(block);
    }

    await this._onDropEnd(this._point, blocks, this._result);

    this._point = null;
    this._result = null;
    this._indicator.rect = null;
  };

  private _onDropEnd(
    point: Point,
    models: Partial<BaseBlockModel>[],
    result: DropResult | null
  ) {
    const len = models.length;
    if (!len) return;

    const { page, mode, pageBlock } = this._getPageInfo();
    assertExists(pageBlock);

    page.captureSync();

    const isPageMode = mode === 'page';
    let type = result?.type || 'none';
    let model = result?.modelState.model || null;

    if (type === 'none' && isPageMode) {
      type = 'after';
      if (!model) {
        const note = getLastNoteBlockElement(pageBlock) as NoteBlockComponent;
        assertExists(note);
        model = note.model.lastItem();
      }
    }

    if (type === 'database') {
      type = 'after';
    }

    let noteId: string | undefined;
    let focusId: string | undefined;

    if (type !== 'none' && model) {
      const parent = page.getParent(model);
      assertExists(parent);
      const ids = page.addSiblingBlocks(model, models, type);
      focusId = ids[ids.length - 1];

      if (isPageMode) {
        asyncFocusRichText(page, focusId);
        return;
      }

      const note = getClosestNoteBlockElementById(
        parent.id,
        pageBlock
      ) as BlockComponentElement;
      assertExists(note);
      noteId = note.model.id;
    }

    if (isPageMode) return;

    // In edgeless mode
    // Creates new notes on blank area.
    let i = 0;
    for (; i < len; i++) {
      const model = models[i];
      if (model.flavour === 'affine:image') {
        const note = (pageBlock as EdgelessPageBlockComponent).addImage(
          model as ImageBlockModel,
          point
        );
        noteId = note.noteId;
      }
    }

    if (!noteId || !focusId) return;

    (pageBlock as EdgelessPageBlockComponent).setSelection(
      noteId,
      true,
      focusId,
      point
    );
  }

  get(type: string): ImportHandler | undefined {
    const handler = this._handlers.get(type);

    // `*`
    if (handler || type === '*') return handler;

    // `image/*`
    if (type.endsWith('/*')) return this.get('*');

    // `image/png`
    return this.get(type.substring(0, type.indexOf('/')) + '/*');
  }

  /**
   * Registers a processing function to handle the specified type.
   *
   * @param type - MIME type
   * @parram handler - A processing handler
   */
  register(type: string, handler: ImportHandler) {
    this._handlers.set(type, handler);
  }
}
