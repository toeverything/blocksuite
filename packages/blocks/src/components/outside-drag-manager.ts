import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import {
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  Point,
} from '../__internal__/index.js';
import type { DragIndicator } from './index.js';
import { DragHandle } from './index.js';

interface OutsideDragHandler {
  filter: (files: FileList) => boolean;
  callback: (
    files: FileList,
    targetModel: BaseBlockModel | null
  ) => Promise<void>;
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

    this._disposables.addFromEvent(
      editor,
      'dragover',
      this._onDragOver.bind(this)
    );
    this._disposables.addFromEvent(editor, 'drop', this._onDrop.bind(this));
  }

  private _onDragOver(event: DragEvent) {
    event.preventDefault();
    const x = event.clientX;
    const y = event.clientY;
    const point = new Point(x, y);
    const page = this._editor.querySelector('affine-default-page');
    assertExists(page);

    const element = getClosestBlockElementByPoint(point, {
      rect: page.innerRect,
    });
    let rect = null;
    if (element) {
      const model = getModelByBlockElement(element);
      const result = DragHandle.calcTarget(point, model, element, [], 1, false);
      if (result) {
        rect = result.rect;
        this._targetModel = result.modelState.model;
      }
    }
    this._indicator.rect = rect;
  }

  private _onDrop(event: DragEvent) {
    assertExists(event.dataTransfer);
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }
    for (const handler of this._handlers) {
      const { filter, callback } = handler;
      if (filter(files)) {
        event.preventDefault();
        callback(files, this._targetModel);
      }
    }
    this._indicator.rect = null;
  }

  registerHandler(
    filter: (files: FileList) => boolean,
    callback: (
      files: FileList,
      targetModel: BaseBlockModel | null
    ) => Promise<void>
  ) {
    this._handlers.push({ filter, callback });
  }
}
