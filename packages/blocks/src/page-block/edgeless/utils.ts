import type { PointerEventState } from '@blocksuite/block-std';
import type { SurfaceManager } from '@blocksuite/phasor';
import {
  Bound,
  contains,
  deserializeXYWH,
  intersects,
  isPointIn as isPointInFromPhasor,
  normalizeWheelDeltaY,
  type PhasorElement,
  serializeXYWH,
  type SurfaceViewport,
  TextElement,
} from '@blocksuite/phasor';
import { assertExists, type Page } from '@blocksuite/store';
import * as Y from 'yjs';

import {
  type EdgelessTool,
  handleNativeRangeAtPoint,
  isEmpty,
  Point,
  type TopLevelBlockModel,
} from '../../__internal__/index.js';
import { isPinchEvent } from '../../__internal__/utils/index.js';
import { GET_DEFAULT_LINE_COLOR } from './components/color-panel.js';
import { SurfaceTextEditor } from './components/surface-text-editor.js';
import type {
  EdgelessContainer,
  EdgelessPageBlockComponent,
} from './edgeless-page-block.js';
import type { Selectable } from './selection-manager.js';

export const NOTE_MIN_WIDTH = 200;
export const NOTE_MIN_HEIGHT = 20;

export const DEFAULT_NOTE_WIDTH = 448;
export const DEFAULT_NOTE_HEIGHT = 72;
export const DEFAULT_NOTE_OFFSET_X = 30;
export const DEFAULT_NOTE_OFFSET_Y = 40;

export function isTopLevelBlock(
  selectable: Selectable | null
): selectable is TopLevelBlockModel {
  return !!selectable && 'flavour' in selectable;
}

export function isPhasorElement(
  selectable: Selectable | null
): selectable is PhasorElement {
  return !isTopLevelBlock(selectable);
}

function isPointIn(
  block: { xywh: string },
  pointX: number,
  pointY: number
): boolean {
  const [x, y, w, h] = deserializeXYWH(block.xywh);
  return isPointInFromPhasor({ x, y, w, h }, pointX, pointY);
}

export function pickTopBlock(
  blocks: TopLevelBlockModel[],
  modelX: number,
  modelY: number
): TopLevelBlockModel | null {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (isPointIn(block, modelX, modelY)) {
      return block;
    }
  }
  return null;
}

export function pickBlocksByBound(
  blocks: TopLevelBlockModel[],
  bound: Omit<Bound, 'serialize'>
) {
  return blocks.filter(block => {
    const [x, y, w, h] = deserializeXYWH(block.xywh);
    const blockBound = { x, y, w, h };
    return contains(bound, blockBound) || intersects(bound, blockBound);
  });
}

export function getSelectionBoxBound(viewport: SurfaceViewport, xywh: string) {
  const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
  const [x, y] = viewport.toViewCoord(modelX, modelY);
  return new DOMRect(x, y, modelW * viewport.zoom, modelH * viewport.zoom);
}

export function initWheelEventHandlers(container: EdgelessContainer) {
  const wheelHandler = (e: WheelEvent) => {
    e.preventDefault();

    const { viewport } = container.surface;
    // pan
    if (!isPinchEvent(e)) {
      const dx = e.deltaX / viewport.zoom;
      const dy = e.deltaY / viewport.zoom;
      viewport.applyDeltaCenter(dx, dy);
      container.slots.viewportUpdated.emit();
    }
    // zoom
    else {
      const { centerX, centerY } = viewport;
      const prevZoom = viewport.zoom;

      const rect = container.getBoundingClientRect();
      // Perform zooming relative to the mouse position
      const [baseX, baseY] = container.surface.toModelCoord(
        e.clientX - rect.x,
        e.clientY - rect.y
      );

      const zoom = normalizeWheelDeltaY(e.deltaY, viewport.zoom);
      viewport.setZoom(zoom);
      const newZoom = viewport.zoom;

      const offsetX = centerX - baseX;
      const offsetY = centerY - baseY;
      const newCenterX = baseX + offsetX * (prevZoom / newZoom);
      const newCenterY = baseY + offsetY * (prevZoom / newZoom);
      viewport.setCenter(newCenterX, newCenterY);

      container.slots.viewportUpdated.emit();
    }
  };

  container.addEventListener('wheel', wheelHandler);
  const dispose = () => container.removeEventListener('wheel', wheelHandler);
  return dispose;
}

export function getXYWH(element: Selectable) {
  return isTopLevelBlock(element)
    ? element.xywh
    : serializeXYWH(element.x, element.y, element.w, element.h);
}

export function stopPropagation(event: Event) {
  event.stopPropagation();
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
export function getCursorMode(edgelessTool: EdgelessTool) {
  switch (edgelessTool.type) {
    case 'default':
      return 'default';
    case 'pan':
      return edgelessTool.panning ? 'grabbing' : 'grab';
    case 'brush':
    case 'eraser':
    case 'shape':
    case 'connector':
      return 'crosshair';
    case 'text':
      return 'text';
    default:
      return 'default';
  }
}

export function pickBy(
  surface: SurfaceManager,
  page: Page,
  x: number,
  y: number,
  filter: (element: Selectable) => boolean
): Selectable | null {
  const [modelX, modelY] = surface.viewport.toModelCoord(x, y);
  const selectedShapes = surface.pickByPoint(modelX, modelY).filter(filter);

  return selectedShapes.length
    ? selectedShapes[selectedShapes.length - 1]
    : pickTopBlock(
        (page.root?.children as TopLevelBlockModel[]).filter(
          child => child.flavour === 'affine:note'
        ) ?? [],
        modelX,
        modelY
      );
}

export function getBackgroundGrid(
  viewportX: number,
  viewportY: number,
  zoom: number,
  showGrid: boolean
) {
  const step = zoom < 0.5 ? 2 : 1 / (Math.floor(zoom) || 1);
  const gap = 20 * step * zoom;
  const translateX = -viewportX * zoom;
  const translateY = -viewportY * zoom;

  return {
    gap,
    translateX,
    translateY,
    grid: showGrid
      ? 'radial-gradient(var(--affine-edgeless-grid-color) 1px, var(--affine-background-primary-color) 1px)'
      : 'unset',
  };
}

export function addNote(
  edgeless: EdgelessPageBlockComponent,
  page: Page,
  event: PointerEventState,
  width = DEFAULT_NOTE_WIDTH
) {
  const noteId = edgeless.addNoteWithPoint(
    new Point(event.point.x, event.point.y),
    {
      width,
    }
  );
  page.addBlock('affine:paragraph', {}, noteId);
  edgeless.slots.edgelessToolUpdated.emit({ type: 'default' });

  // Wait for edgelessTool updated
  requestAnimationFrame(() => {
    const blocks =
      (page.root?.children.filter(
        child => child.flavour === 'affine:note'
      ) as TopLevelBlockModel[]) ?? [];
    const element = blocks.find(b => b.id === noteId);
    if (element) {
      edgeless.slots.selectionUpdated.emit({
        selected: [element],
        active: true,
      });

      // Waiting dom updated, `note mask` is removed
      edgeless.updateComplete.then(() => {
        // Cannot reuse `handleNativeRangeClick` directly here,
        // since `retargetClick` will re-target to pervious editor
        handleNativeRangeAtPoint(event.raw.clientX, event.raw.clientY);

        // Waiting dom updated, remove note if it is empty
        requestAnimationFrame(() => {
          edgeless.slots.selectionUpdated.once(({ active }) => {
            const block = page.getBlockById(noteId);
            assertExists(block);
            if (!active && isEmpty(block)) {
              page.deleteBlock(element);
            }
          });
        });
      });
    }
  });
}

export function mountTextEditor(
  textElement: TextElement,
  edgeless: EdgelessPageBlockComponent
) {
  const textEditor = new SurfaceTextEditor();
  const pageBlockContainer = edgeless.pageBlockContainer;

  pageBlockContainer.appendChild(textEditor);
  textEditor.mount(textElement, edgeless);
  textEditor.vEditor?.focusEnd();
  edgeless.selection.switchToDefaultMode({
    selected: [textElement],
    active: true,
  });
}

export function addText(
  edgeless: EdgelessPageBlockComponent,
  event: PointerEventState
) {
  const selected = edgeless.surface.pickTop(event.x, event.y);
  if (!selected) {
    const [modelX, modelY] = edgeless.surface.viewport.toModelCoord(
      event.x,
      event.y
    );
    const id = edgeless.surface.addElement('text', {
      xywh: new Bound(modelX, modelY, 32, 32).serialize(),
      text: new Y.Text(),
      textAlign: 'left',
      fontSize: 24,
      color: GET_DEFAULT_LINE_COLOR(),
    });
    edgeless.page.captureSync();
    const textElement = edgeless.surface.pickById(id);
    assertExists(textElement);
    if (textElement instanceof TextElement) {
      mountTextEditor(textElement, edgeless);
    }
  }
}

export function xywhArrayToObject(element: TopLevelBlockModel) {
  const [x, y, w, h] = deserializeXYWH(element.xywh);
  return {
    x,
    y,
    w,
    h,
  };
}
