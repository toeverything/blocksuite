import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import {
  asyncFocusRichText,
  calcDropTarget,
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  Point,
} from '../__internal__/index.js';
import type { DragIndicator } from './index.js';

interface OutsideDragHandler {
  filter: (files: FileList) => boolean;
  file2props: (files: FileList) => Promise<Array<Partial<BaseBlockModel>>>;
}

export class OutsideDragManager {
  private _editor: HTMLElement;
  private _indicator!: DragIndicator;
  private _disposables = new DisposableGroup();
  private _handlers: Array<OutsideDragHandler> = [];
  private _targetModel: BaseBlockModel | null = null;

  constructor(editor: HTMLElement) {
    this._editor = editor;
    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
    if (!this._indicator) {
      this._indicator = <DragIndicator>(
        document.createElement('affine-drag-indicator')
      );
      document.body.appendChild(this._indicator);
    }

    this._disposables.addFromEvent(editor, 'dragover', this._onDragOver);
    this._disposables.addFromEvent(editor, 'drop', this._onDrop);
  }

  private _onDragOver = (event: DragEvent) => {
    const page = this._editor.querySelector('affine-default-page');
    if (page === null) {
      return;
    }

    event.preventDefault();
    const x = event.clientX;
    const y = event.clientY;
    const point = new Point(x, y);
    const element = getClosestBlockElementByPoint(point, {
      rect: page.innerRect,
    });
    let rect = null;
    if (element) {
      const model = getModelByBlockElement(element);
      const result = calcDropTarget(point, model, element, [], 1);
      if (result && model.flavour !== 'affine:database') {
        rect = result.rect;
        this._targetModel = result.modelState.model;
      }
    }
    this._indicator.rect = rect;
  };

  private _onDrop = async (event: DragEvent) => {
    event.preventDefault();
    assertExists(event.dataTransfer);
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }
    for (const handler of this._handlers) {
      const { filter, file2props } = handler;
      if (filter(files)) {
        const blocks = await file2props(files);
        if (this._targetModel) {
          const page = this._targetModel.page;
          page.captureSync();
          const parent = page.getParent(this._targetModel);
          assertExists(parent);
          const ids = page.addSiblingBlocks(this._targetModel, blocks);
          const focusId = ids[0];
          asyncFocusRichText(page, focusId);
        }
      }
    }
    this._indicator.rect = null;
  };

  registerHandler(
    filter: (files: FileList) => boolean,
    file2props: (files: FileList) => Promise<Array<Partial<BaseBlockModel>>>
  ) {
    this._handlers.push({ filter, file2props });
  }
}
