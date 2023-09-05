import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';

import { getBlockClipboardInfo } from '../../../__internal__/clipboard/index.js';
import {
  type DefaultTool,
  handleNativeRangeAtPoint,
  resetNativeSelection,
  type TopLevelBlockModel,
} from '../../../__internal__/index.js';
import type { SurfaceBlockComponent } from '../../../surface-block/index.js';
import {
  Bound,
  ConnectorElement,
  FrameElement,
  type HitTestOptions,
  type PhasorElement,
  type PhasorElementType,
  ShapeElement,
  TextElement,
} from '../../../surface-block/index.js';
import { isConnectorAndBindingsAllSelected } from '../connector-manager.js';
import type { Selectable } from '../services/tools-manager.js';
import { edgelessElementsBound } from '../utils/bound-utils.js';
import {
  isPhasorElement,
  isTopLevelBlock,
  pickBlocksByBound,
  pickTopBlock,
} from '../utils/query.js';
import {
  addText,
  mountFrameEditor,
  mountShapeEditor,
  mountTextEditor,
} from '../utils/text.js';
import { EdgelessToolController } from './index.js';

export enum DefaultModeDragType {
  /** Moving selected contents */
  ContentMoving = 'content-moving',
  /** Expanding the dragging area, select the content covered inside */
  Selecting = 'selecting',
  /** Native range dragging inside active note block */
  NativeEditing = 'native-editing',
  /** Default void state */
  None = 'none',
  /** Dragging preview */
  PreviewDragging = 'preview-dragging',
  /** press alt/option key to clone selected  */
  AltCloning = 'alt-cloning',
}

export class DefaultToolController extends EdgelessToolController<DefaultTool> {
  readonly tool = <DefaultTool>{
    type: 'default',
  };
  override enableHover = true;
  dragType = DefaultModeDragType.None;

  private _dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private _dragLastPos: { x: number; y: number } = { x: 0, y: 0 };
  private _lastMoveDelta = { x: 0, y: 0 };
  private _lock = false;
  // Do not select the text, when click again after activating the note.
  private _isDoubleClickedOnMask = false;
  private _alignBound = new Bound();
  private _selectedBounds: Bound[] = [];
  private _toBeMoved: Selectable[] = [];
  private _frames = new Set<FrameElement>();

  override get draggingArea() {
    if (this.dragType === DefaultModeDragType.Selecting) {
      return {
        start: new DOMPoint(this._dragStartPos.x, this._dragStartPos.y),
        end: new DOMPoint(this._dragLastPos.x, this._dragLastPos.y),
      };
    }
    return null;
  }

  get selection() {
    return this._edgeless.selectionManager;
  }

  get selectedBlocks() {
    return this.selection.selectedBlocks;
  }

  get state() {
    return this.selection.state;
  }

  get isActive() {
    return this.selection.state.editing;
  }

  private _pick(x: number, y: number, options?: HitTestOptions) {
    const { surface } = this._edgeless;
    const [modelX, modelY] = surface.viewport.toModelCoord(x, y);
    const selectedShape = surface.pickTop(modelX, modelY, options);
    return selectedShape
      ? selectedShape
      : pickTopBlock(this._blocks, modelX, modelY);
  }

  private _setNoneSelectionState() {
    if (this.selection.empty) return;

    this.selection.setSelection({
      elements: [],
      editing: false,
    });
    resetNativeSelection(null);
  }

  private _setSelectionState(elements: string[], editing: boolean) {
    this.selection.setSelection({
      elements,
      editing,
    });
  }

  private _handleClickOnSelected(element: Selectable, e: PointerEventState) {
    const { elements, editing } = this.state;
    this.selection.setSelectedBlocks([]);
    // click the inner area of active text and note element
    if (editing && elements.length === 1 && elements[0] === element.id) {
      handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
      return;
    }

    // handle single note block click
    if (!e.keys.shift && elements.length === 1 && isTopLevelBlock(element)) {
      if (
        (elements[0] === element.id && !editing) ||
        (editing && elements[0] !== element.id)
      ) {
        // issue #1809
        // If the previously selected element is a noteBlock and is in an active state,
        // then the currently clicked noteBlock should also be in an active state when selected.
        this._setSelectionState([element.id], true);
        requestAnimationFrame(() => {
          handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
        });
        this.selection.setSelectedBlocks([]);
        return;
      }
    }

    // hold shift key to multi select or de-select element
    if (e.keys.shift) {
      const selections = [...elements];
      if (elements.includes(element.id)) {
        this._setSelectionState(
          selections.filter(id => id !== element.id),
          false
        );
      } else {
        this._setSelectionState([...selections, element.id], false);
      }
    } else {
      this._setSelectionState([element.id], false);
    }
  }

  private _handleSurfaceDragMove(
    selected: PhasorElement,
    initialBound: Bound,
    delta: { x: number; y: number }
  ) {
    if (!this._lock) {
      this._lock = true;
      this._page.captureSync();
    }

    const { surface } = this._edgeless;
    const bound = initialBound.clone();
    bound.x += delta.x;
    bound.y += delta.y;

    if (selected instanceof ConnectorElement) {
      this._surface.connector.updateXYWH(selected, bound);
    }

    surface.setElementBound(selected.id, bound);
  }

  private _handleBlockDragMove(
    block: TopLevelBlockModel,
    initialBound: Bound,
    delta: { x: number; y: number }
  ) {
    const bound = initialBound.clone();
    bound.x += delta.x;
    bound.y += delta.y;

    this._page.updateBlock(block, { xywh: bound.serialize() });

    // TODO: refactor
    if (this.selectedBlocks.length) {
      this.selection.setSelectedBlocks(this.selectedBlocks);
    }
  }

  private _isInSelectedRect(viewX: number, viewY: number) {
    const selected = this.selection.elements;
    if (!selected.length) return false;

    const commonBound = edgelessElementsBound(selected);

    const [modelX, modelY] = this._surface.toModelCoord(viewX, viewY);
    if (commonBound && commonBound.isPointInBound([modelX, modelY])) {
      return true;
    }
    return false;
  }

  private _isDraggable(element: Selectable) {
    return !(
      element instanceof ConnectorElement &&
      !isConnectorAndBindingsAllSelected(element, this._toBeMoved)
    );
  }

  private _forceUpdateSelection(
    type: DefaultModeDragType,
    dragging = false,
    delta = { x: 0, y: 0 }
  ) {
    this._edgeless.slots.selectedRectUpdated.emit({
      type: type === DefaultModeDragType.Selecting ? 'select' : 'move',
      delta,
      dragging,
    });
  }

  onContainerPointerDown(): void {
    noop();
  }

  onContainerClick(e: PointerEventState) {
    const selected = this._pick(e.x, e.y);

    if (selected) {
      this._handleClickOnSelected(selected, e);
    } else {
      this._setNoneSelectionState();
    }

    this._isDoubleClickedOnMask = false;
  }

  onContainerContextMenu() {
    // repairContextMenuRange(e);
    noop();
  }

  onContainerDblClick(e: PointerEventState) {
    const selected = this._pick(e.x, e.y, {
      pierce: false,
      expand: 10,
    });
    if (!selected) {
      addText(this._edgeless, e);
      return;
    } else {
      if (selected instanceof TextElement) {
        const [modelX, modelY] = this._edgeless.surface.viewport.toModelCoord(
          e.x,
          e.y
        );
        mountTextEditor(selected, this._edgeless, { x: modelX, y: modelY });
        return;
      }
      if (selected instanceof ShapeElement) {
        mountShapeEditor(selected, this._edgeless);
        return;
      }
      if (selected instanceof FrameElement) {
        mountFrameEditor(selected, this._edgeless);
        return;
      }
    }

    if (
      e.raw.target &&
      e.raw.target instanceof HTMLElement &&
      e.raw.target.classList.contains('affine-note-mask')
    ) {
      this.onContainerClick(e);
      this._isDoubleClickedOnMask = true;
      return;
    }
  }

  onContainerTripleClick() {
    if (this._isDoubleClickedOnMask) return;
  }

  private _determineDragType(e: PointerEventState): DefaultModeDragType {
    // Is dragging started from current selected rect
    if (this._isInSelectedRect(e.x, e.y)) {
      return this.state.editing
        ? DefaultModeDragType.NativeEditing
        : DefaultModeDragType.ContentMoving;
    } else {
      const selected = this._pick(e.x, e.y);
      if (selected) {
        this._setSelectionState([selected.id], false);
        return DefaultModeDragType.ContentMoving;
      } else {
        return DefaultModeDragType.Selecting;
      }
    }
  }

  private async _cloneContent() {
    this._lock = true;
    const { surface } = this._edgeless;
    const elements = (await Promise.all(
      this._toBeMoved.map(async selected => {
        return await this._cloneSelected(selected, surface);
      })
    )) as Selectable[];

    this._setSelectionState(
      elements.map(el => el.id),
      false
    );
  }

  private async _cloneSelected(
    selected: Selectable,
    surface: SurfaceBlockComponent
  ) {
    if (isTopLevelBlock(selected)) {
      const noteService = this._edgeless.getService('affine:note');
      const id = this._page.addBlock(
        'affine:note',
        { xywh: selected.xywh },
        this._page.root?.id
      );
      const note = this._page.getBlockById(id);

      assertExists(note);
      const serializedBlock = (await getBlockClipboardInfo(selected)).json;
      await noteService.json2Block(note, serializedBlock.children);
      return this._page.getBlockById(id);
    } else {
      const id = surface.addElement(
        selected.type as keyof PhasorElementType,
        selected.serialize() as unknown as Record<string, unknown>
      );
      return surface.pickById(id);
    }
  }

  private _addFrames() {
    this.selection.elements.forEach(ele => {
      if (ele instanceof FrameElement) {
        this._frames.add(ele);
      } else {
        const frame = this._edgeless.surface.frame.selectFrame([ele]);
        if (frame) {
          this._frames.add(frame);
        }
      }
    });
  }

  async onContainerDragStart(e: PointerEventState) {
    // Determine the drag type based on the current state and event
    let dragType = this._determineDragType(e);

    const elements = this.selection.elements;
    const toBeMoved = new Set(elements);
    elements.forEach(element => {
      if (element instanceof FrameElement) {
        this._surface.frame
          .getElementsInFrame(element)
          .forEach(ele => toBeMoved.add(ele));
      }
    });
    this._toBeMoved = Array.from(toBeMoved);
    // If alt key is pressed and content is moving, clone the content
    if (e.keys.alt && dragType === DefaultModeDragType.ContentMoving) {
      dragType = DefaultModeDragType.AltCloning;
      await this._cloneContent();
    }

    this._addFrames();
    // Set up drag state
    this.initializeDragState(e, dragType);
  }

  initializeDragState(e: PointerEventState, dragType: DefaultModeDragType) {
    const { x, y } = e;
    this.dragType = dragType;
    this._dragStartPos = { x, y };
    this._dragLastPos = { x, y };

    this._alignBound = this._surface.snap.setupAlignables(this._toBeMoved);

    this._selectedBounds = this._toBeMoved.map(element =>
      Bound.deserialize(element.xywh)
    );
  }

  onContainerDragMove(e: PointerEventState) {
    const { surface } = this._edgeless;
    const zoom = surface.viewport.zoom;
    switch (this.dragType) {
      case DefaultModeDragType.Selecting: {
        const startX = this._dragStartPos.x;
        const startY = this._dragStartPos.y;
        const viewX = Math.min(startX, e.x);
        const viewY = Math.min(startY, e.y);

        const [x, y] = surface.toModelCoord(viewX, viewY);
        const w = Math.abs(startX - e.x);
        const h = Math.abs(startY - e.y);
        const { zoom } = surface.viewport;
        const bound = new Bound(x, y, w / zoom, h / zoom);

        const blocks = pickBlocksByBound(this._blocks, bound);
        const elements = surface.pickByBound(bound);
        this._setSelectionState(
          [
            ...blocks.map(block => block.id),
            ...elements.map(element => element.id),
          ],
          false
        );

        this._forceUpdateSelection(this.dragType, true);
        break;
      }
      case DefaultModeDragType.AltCloning:
      case DefaultModeDragType.ContentMoving: {
        if (
          this._toBeMoved.every(ele => {
            return !this._isDraggable(ele);
          })
        ) {
          return;
        }

        const dx = (e.x - this._dragStartPos.x) / zoom;
        const dy = (e.y - this._dragStartPos.y) / zoom;
        const curBound = this._alignBound.clone();
        curBound.x += dx;
        curBound.y += dy;

        const alignRst = surface.snap.align(curBound);
        const delta = {
          x: dx + alignRst.dx,
          y: dy + alignRst.dy,
        };

        this._toBeMoved.forEach((element, index) => {
          if (isPhasorElement(element)) {
            if (!this._isDraggable(element)) return;
            this._handleSurfaceDragMove(
              element,
              this._selectedBounds[index],
              delta
            );
          } else {
            this._handleBlockDragMove(
              element,
              this._selectedBounds[index],
              delta
            );
          }
        });
        const frame = surface.frame.selectFrame(this._toBeMoved);
        frame
          ? surface.frame.setHighlight(frame)
          : surface.frame.clearHighlight();

        this._forceUpdateSelection(this.dragType, true, {
          x: delta.x - this._lastMoveDelta.x,
          y: delta.y - this._lastMoveDelta.y,
        });
        this._lastMoveDelta = delta;
        break;
      }
      case DefaultModeDragType.NativeEditing: {
        // TODO reset if drag out of note
        break;
      }
    }
    this._dragLastPos = {
      x: e.x,
      y: e.y,
    };
  }

  onContainerDragEnd() {
    if (this._lock) {
      this._page.captureSync();
      this._lock = false;
    }

    if (this.isActive) {
      return;
    }
    const { surface } = this._edgeless;
    this._dragStartPos = { x: 0, y: 0 };
    this._dragLastPos = { x: 0, y: 0 };
    this._selectedBounds = [];
    this._lastMoveDelta = { x: 0, y: 0 };
    surface.snap.cleanupAlignables();
    surface.frame.clearHighlight();
    this._addFrames();
    this._frames.forEach(frame => {
      surface.frame.calculateFrameColor(frame);
    });
    this._frames.clear();
    this._toBeMoved = [];
    this._forceUpdateSelection(this.dragType);
    this.dragType = DefaultModeDragType.None;
  }

  onContainerMouseMove() {
    noop();
  }

  onContainerMouseOut(_: PointerEventState) {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    noop();
  }
}
