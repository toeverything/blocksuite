import type { BlockService } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import {
  calcDropTarget,
  type DropResult,
  getClosestBlockElementByPoint,
  getModelByBlockComponent,
  isInsidePageEditor,
  matchFlavours,
  Point,
} from '../../_common/utils/index.js';
import type { IVec2 } from '../../surface-block/index.js';
import type { DragIndicator } from './drag-indicator.js';

export type onDropProps = {
  files: File[];
  targetModel: BlockModel | null;
  place: 'before' | 'after';
  point: IVec2;
};

export type FileDropOptions = {
  flavour: string;
  onDrop?: ({
    files,
    targetModel,
    place,
    point,
  }: onDropProps) => Promise<boolean> | void;
};

export class FileDropManager {
  get editorHost(): EditorHost {
    return this._blockService.std.host as EditorHost;
  }

  get doc() {
    return this._blockService.doc;
  }

  get type(): 'before' | 'after' {
    return !FileDropManager._dropResult ||
      FileDropManager._dropResult.type !== 'before'
      ? 'after'
      : 'before';
  }

  get targetModel(): BlockModel | null {
    let targetModel = FileDropManager._dropResult?.modelState.model || null;

    if (!targetModel && isInsidePageEditor(this.editorHost)) {
      const rootModel = this.doc.root;
      assertExists(rootModel);

      let lastNote = rootModel.children[rootModel.children.length - 1];
      if (!lastNote || !matchFlavours(lastNote, ['affine:note'])) {
        const newNoteId = this.doc.addBlock('affine:note', {}, rootModel.id);
        const newNote = this.doc.getBlockById(newNoteId);
        assertExists(newNote);
        lastNote = newNote;
      }

      const lastItem = lastNote.children[lastNote.children.length - 1];
      if (lastItem) {
        targetModel = lastItem;
      } else {
        const newParagraphId = this.doc.addBlock(
          'affine:paragraph',
          {},
          lastNote,
          0
        );
        const newParagraph = this.doc.getBlockById(newParagraphId);
        assertExists(newParagraph);
        targetModel = newParagraph;
      }
    }
    return targetModel;
  }

  private static _dropResult: DropResult | null = null;

  private _blockService: BlockService;

  private _fileDropOptions: FileDropOptions;

  private _indicator!: DragIndicator;

  constructor(blockService: BlockService, fileDropOptions: FileDropOptions) {
    this._blockService = blockService;
    this._fileDropOptions = fileDropOptions;

    this._indicator = document.querySelector(
      'affine-drag-indicator'
    ) as DragIndicator;
    if (!this._indicator) {
      this._indicator = document.createElement(
        'affine-drag-indicator'
      ) as DragIndicator;
      document.body.append(this._indicator);
    }

    if (fileDropOptions.onDrop) {
      this._blockService.disposables.addFromEvent(
        this._blockService.std.host,
        'drop',
        this._onDrop
      );
    }
  }

  private _onDrop = (event: DragEvent) => {
    this._indicator.rect = null;

    const { onDrop } = this._fileDropOptions;
    if (!onDrop) return;

    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) return;

    const effectAllowed = dataTransfer.effectAllowed;
    if (effectAllowed === 'none') return;

    const droppedFiles = dataTransfer.files;
    if (!droppedFiles || !droppedFiles.length) return;

    event.preventDefault();

    const { targetModel, type: place } = this;
    const { x, y } = event;

    onDrop({
      files: [...droppedFiles],
      targetModel,
      place,
      point: [x, y],
    })?.catch(console.error);
  };

  onDragOver = (event: DragEvent) => {
    event.preventDefault();

    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) return;

    const effectAllowed = dataTransfer.effectAllowed;
    if (effectAllowed === 'none') return;

    const { clientX, clientY } = event;
    const point = new Point(clientX, clientY);
    const element = getClosestBlockElementByPoint(point.clone());

    let result: DropResult | null = null;
    if (element) {
      const model = getModelByBlockComponent(element);
      const parent = this.doc.getParent(model);
      if (!matchFlavours(parent, ['affine:surface'])) {
        result = calcDropTarget(point, model, element);
      }
    }
    if (result) {
      FileDropManager._dropResult = result;
      this._indicator.rect = result.rect;
    } else {
      FileDropManager._dropResult = null;
      this._indicator.rect = null;
    }
  };

  onDragLeave = () => {
    FileDropManager._dropResult = null;
    this._indicator.rect = null;
  };
}
