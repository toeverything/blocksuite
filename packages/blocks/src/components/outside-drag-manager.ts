import type { BaseBlockModel } from '@blocksuite/store';

import {
  calcDropTarget,
  type DropResult,
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  Point,
} from '../__internal__/index.js';
import type { DragIndicator } from './index.js';

export type DropEndHandler = (
  point: Point,
  blocks: Partial<BaseBlockModel>[],
  result: DropResult | null
) => Promise<void>;

type ImportHandler = (file: File) => Promise<Partial<BaseBlockModel> | void>;

export class OutsideDragManager {
  private _indicator!: DragIndicator;
  private _point: Point | null = null;
  private _result: DropResult | null = null;
  private _onDropEnd: DropEndHandler;
  private _handlers: Map<string, ImportHandler> = new Map();

  constructor(onDropEnd: DropEndHandler) {
    this._onDropEnd = onDropEnd;
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

    const { clientX, clientY } = event;
    const point = new Point(clientX, clientY);
    const element = getClosestBlockElementByPoint(point.clone());

    let result = null;
    let rect = null;
    if (element) {
      const model = getModelByBlockElement(element);
      result = calcDropTarget(point, model, element, [], 1);
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
    if (!files || files.length === 0) return;

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

    this._result = null;
    this._indicator.rect = null;
  };

  get(type: string): ImportHandler | undefined {
    const handler = this._handlers.get(type);

    // `*`
    if (handler || type === '*') return handler;

    // `image/*`
    if (type.endsWith('/*')) return this.get('*');

    // `image/png`
    return this.get(type.replace(/\/(.*)$/, '/*'));
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
