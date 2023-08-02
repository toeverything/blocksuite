import {
  assertExists,
  type BaseBlockModel,
  matchFlavours,
  type Page,
} from '@blocksuite/store';

import {
  asyncFocusRichText,
  calcDropTarget,
  type DropResult,
  getBlockElementByModel,
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  Point,
} from '../__internal__/index.js';
import type {
  AbstractEditor,
  DefaultPageBlockComponent,
  EdgelessPageBlockComponent,
  ImageBlockModel,
} from '../index.js';
import type { DragIndicator } from './index.js';

export type GetPageInfo = () => {
  page: Page;
  mode: 'page' | 'edgeless';
  pageBlock: DefaultPageBlockComponent | EdgelessPageBlockComponent | undefined;
};

type ImportHandler = (file: File) => Promise<Partial<BaseBlockModel> | void>;

type FileDropRule = {
  name: string;
  matcher: (file: File) => boolean;
  handler: ImportHandler;
};

export class FileDropManager {
  private _editor: AbstractEditor;

  private _indicator!: DragIndicator;
  private _point: Point | null = null;
  private _result: DropResult | null = null;
  private _handlers: FileDropRule[] = [];

  constructor(_editor: AbstractEditor) {
    this._editor = _editor;
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
      const handler = this.findFileHandler(file);

      if (!handler) {
        console.warn(`This ${file.type} is not currently supported.`);
        continue;
      }

      const block = await handler(file);
      if (block) blocks.push(block);
    }

    this._onDropEnd(this._point, blocks, this._result);

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

    const { page, mode } = this._editor;
    const pageBlock = page.root;
    assertExists(pageBlock);

    const isPageMode = mode === 'page';
    let type = result?.type || 'none';
    let model = result?.modelState.model || null;

    if (type === 'none' && isPageMode) {
      type = 'after';
      if (!model) {
        const lastNote = pageBlock.children[pageBlock.children.length - 1];
        if (!matchFlavours(lastNote, ['affine:note']))
          throw new Error('The last block is not a note block.');
        model = lastNote.lastItem();
      }
    }

    if (type === 'database') {
      type = 'after';
    }

    let noteId: string | undefined;
    let focusId: string | undefined;

    page.captureSync();

    if (type !== 'none' && model) {
      const parent = page.getParent(model);
      assertExists(parent);
      const ids = page.addSiblingBlocks(model, models, type);
      focusId = ids[ids.length - 1];
      if (isPageMode) asyncFocusRichText(page, focusId);
      return;
    }
    if (isPageMode) return;

    const edgelessBlockEle = getBlockElementByModel(
      pageBlock
    ) as EdgelessPageBlockComponent | null;
    assertExists(edgelessBlockEle);
    // In edgeless mode
    // Creates new notes on blank area.
    let i = 0;
    for (; i < len; i++) {
      const model = models[i];
      if (model.flavour === 'affine:image') {
        const note = (edgelessBlockEle as EdgelessPageBlockComponent).addImage(
          model as ImageBlockModel,
          point
        );
        noteId = note.noteId;
      }
    }
    if (!noteId || !focusId) return;

    (edgelessBlockEle as EdgelessPageBlockComponent).setSelection(
      noteId,
      true,
      focusId,
      point
    );
  }

  findFileHandler(file: File): ImportHandler | undefined {
    const ruler = this._handlers.find(handler => handler.matcher(file));
    return ruler?.handler;
  }

  /**
   * Registers a processing function to handle the specified type.
   */
  register(rule: FileDropRule) {
    // Remove duplicated rule
    this._handlers = this._handlers.filter(({ name }) => name !== rule.name);
    this._handlers.push(rule);
  }
}
