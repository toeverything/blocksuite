/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../declare-test-window.js';

import type { CssVariableName } from '@blocksuite/blocks';
import type { IPoint } from '@blocksuite/blocks/std';
import { sleep } from '@blocksuite/global/utils';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import type { NoteBlockModel } from '../../../packages/blocks/src/index.js';
import { dragBetweenCoords } from './drag.js';
import {
  pressBackspace,
  selectAllByKeyboard,
  SHIFT_KEY,
  SHORT_KEY,
  type,
} from './keyboard.js';
import { MODIFIER_KEY } from './keyboard.js';
import {
  getEditorLocator,
  waitForVirgoStateUpdated,
  waitNextFrame,
} from './misc.js';

export async function getNoteRect(
  page: Page,
  ids: { pageId: string; noteId: string; paragraphId: string }
) {
  const xywh: string | null = await page.evaluate(
    ([id]) => {
      const page = window.workspace.getPage('page0');
      const block = page?.getBlockById(id.noteId);
      if (block?.flavour === 'affine:note') {
        return (block as NoteBlockModel).xywh;
      } else {
        return null;
      }
    },
    [ids] as const
  );
  expect(xywh).not.toBeNull();
  const [x, y, w, h] = JSON.parse(xywh as string);
  return { x, y, w, h };
}

export async function registerFormatBarCustomElements(page: Page) {
  await page.click('sl-button[content="Register FormatBar Custom Elements"]');
}

export async function switchEditorMode(page: Page) {
  await page.click('sl-button[content="Switch Editor Mode"]');
  // FIXME: listen to editor loaded event
  await waitNextFrame(page);
}

export async function switchEditorEmbedMode(page: Page) {
  await page.click('sl-button[content="Add container offset"]');
}

export function locatorPanButton(page: Page, innerContainer = true) {
  return locatorEdgelessToolButton(page, 'pan', innerContainer);
}

type EdgelessTool =
  | 'default'
  | 'shape'
  | 'brush'
  | 'pan'
  | 'text'
  | 'connector'
  | 'note'
  | 'eraser';
type ToolType = EdgelessTool | 'zoomIn' | 'zoomOut' | 'fitToScreen';
type ComponentToolType = 'shape' | 'thin' | 'thick' | 'brush' | 'more';

export function locatorEdgelessToolButton(
  page: Page,
  type: ToolType,
  innerContainer = true
) {
  const text = {
    default: 'Select',
    shape: 'Shape',
    brush: 'Pen',
    eraser: 'Eraser',
    pan: 'Hand',
    text: 'Text',
    connector: 'Connector',
    note: 'Note',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fitToScreen: 'Fit to screen',
  }[type];
  const button = page
    .locator('edgeless-toolbar edgeless-tool-icon-button')
    .filter({
      hasText: text,
    });

  return innerContainer ? button.locator('.icon-container') : button;
}

export function locatorEdgelessComponentToolButton(
  page: Page,
  type: ComponentToolType,
  innerContainer = true
) {
  const text = {
    shape: 'Shape',
    brush: 'Color',
    thin: 'Thin',
    thick: 'Thick',
    more: 'More',
  }[type];
  const button = page
    .locator('edgeless-component-toolbar edgeless-tool-icon-button')
    .filter({
      hasText: text,
    });

  return innerContainer ? button.locator('.icon-container') : button;
}

export async function setEdgelessTool(page: Page, mode: EdgelessTool) {
  switch (mode) {
    case 'default':
    case 'brush':
    case 'pan':
    case 'text':
    case 'note':
    case 'eraser':
    case 'connector': {
      const button = locatorEdgelessToolButton(page, mode, false);
      await button.click();
      break;
    }
    case 'shape': {
      const shapeToolButton = locatorEdgelessToolButton(page, 'shape', false);
      await shapeToolButton.click();

      const squareShapeButton = page
        .locator('edgeless-tool-icon-button')
        .filter({ hasText: 'Square' });
      await squareShapeButton.click();
      break;
    }
  }
}

export async function assertEdgelessTool(page: Page, mode: EdgelessTool) {
  const type = await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) {
      throw new Error('Missing edgeless page');
    }
    return container.edgelessTool.type;
  });
  expect(type).toEqual(mode);
}

export async function switchShapeType(page: Page, shapeType: string) {
  // TODO
}

export async function getEdgelessHoverRect(page: Page) {
  const hoverRect = page.locator('.affine-edgeless-hover-rect');
  const box = await hoverRect.boundingBox();
  if (!box) throw new Error('Missing edgeless hover rect');
  return box;
}

export async function getEdgelessBlockChild(page: Page) {
  const block = page.locator('.affine-edgeless-child-note');
  const blockBox = await block.boundingBox();
  if (blockBox === null) throw new Error('Missing edgeless block child rect');
  return blockBox;
}

export async function getEdgelessSelectedRect(page: Page) {
  const selectedBox = await page.evaluate(() => {
    const selected = document
      .querySelector('edgeless-selected-rect')
      ?.shadowRoot?.querySelector('.affine-edgeless-selected-rect');
    if (!selected) {
      throw new Error('Missing edgeless selected rect');
    }
    return selected.getBoundingClientRect();
  });
  return selectedBox;
}

const AWAIT_TIMEOUT = 160;

export async function decreaseZoomLevel(page: Page) {
  const btn = locatorEdgelessToolButton(page, 'zoomOut', false);
  await btn.click();
  await sleep(AWAIT_TIMEOUT);
}

export async function increaseZoomLevel(page: Page) {
  const btn = locatorEdgelessToolButton(page, 'zoomIn', false);
  await btn.click();
  await sleep(AWAIT_TIMEOUT);
}

export async function autoFit(page: Page) {
  const btn = locatorEdgelessToolButton(page, 'fitToScreen', false);
  await btn.click();
  await sleep(AWAIT_TIMEOUT);
}

export async function addBasicBrushElement(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
  auto = true
) {
  await setEdgelessTool(page, 'brush');
  await dragBetweenCoords(page, start, end, { steps: 100 });
  auto && (await setEdgelessTool(page, 'default'));
}

export async function addBasicRectShapeElement(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  await setEdgelessTool(page, 'shape');
  await dragBetweenCoords(page, start, end, { steps: 20 });
}

export async function addBasicConnectorElement(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  await setEdgelessTool(page, 'connector');
  await dragBetweenCoords(page, start, end, { steps: 100 });
}

export async function addNote(page: Page, text: string, x: number, y: number) {
  await setEdgelessTool(page, 'note');
  await page.mouse.click(x, y);
  await waitForVirgoStateUpdated(page);
  await type(page, text);
}

export async function resizeElementByTopLeftHandle(
  page: Page,
  delta: { x: number; y: number },
  steps = 1
) {
  const topLeftHandle = page.locator('[aria-label="handle-top-left"]');
  const box = await topLeftHandle.boundingBox();
  if (box === null) throw new Error();
  const offset = 5;
  await dragBetweenCoords(
    page,
    { x: box.x + offset, y: box.y + offset },
    { x: box.x + delta.x + offset, y: box.y + delta.y + offset },
    {
      steps,
    }
  );
}

export async function selectBrushColor(page: Page, color: CssVariableName) {
  const colorButton = page.locator(
    `edgeless-brush-menu .color-unit[aria-label="${color.toLowerCase()}"]`
  );
  await colorButton.click();
}

export async function selectBrushSize(page: Page, size: 4 | 10) {
  const sizeMap = { 4: 'thin', 10: 'thick' };
  const sizeButton = page.locator(
    `edgeless-brush-menu .brush-size-button .${sizeMap[size]}`
  );
  await sizeButton.click();
}

export async function pickColorAtPoints(page: Page, points: number[][]) {
  const pickedColors: `#${string}`[] = await page.evaluate(points => {
    const node = document.querySelector(
      '.affine-edgeless-surface-block-container canvas'
    ) as HTMLCanvasElement;
    const w = node.width;
    const h = node.height;
    const ctx = node?.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    const pixelData = ctx.getImageData(0, 0, w, h).data;

    const colors = points.map(([x, y]) => {
      const startPosition = (y * w + x) * 4;
      return ('#' +
        (
          (1 << 24) +
          (pixelData[startPosition] << 16) +
          (pixelData[startPosition + 1] << 8) +
          pixelData[startPosition + 2]
        )
          .toString(16)
          .slice(1)) as `#${string}`;
    });
    return colors;
  }, points);
  return pickedColors;
}

export async function getNoteBoundBoxInEdgeless(page: Page, noteId: string) {
  const editor = getEditorLocator(page);
  const note = editor.locator(`affine-note[data-block-id="${noteId}"]`);
  const bound = await note.boundingBox();
  if (!bound) {
    throw new Error(`Missing note: ${noteId}`);
  }
  return bound;
}

export async function getAllNotes(page: Page) {
  return await page.evaluate(() => {
    return document.querySelectorAll('affine-note');
  });
}

export async function countBlock(page: Page, flavour: string) {
  return await page.evaluate(
    ([flavour]) => {
      return Array.from(document.querySelectorAll(flavour)).length;
    },
    [flavour]
  );
}

export async function activeNoteInEdgeless(page: Page, noteId: string) {
  const bound = await getNoteBoundBoxInEdgeless(page, noteId);
  await page.mouse.dblclick(bound.x + 8, bound.y + 8);
}

export async function selectNoteInEdgeless(page: Page, noteId: string) {
  const bound = await getNoteBoundBoxInEdgeless(page, noteId);
  await page.mouse.click(bound.x, bound.y);
}

export async function updateExistedBrushElementSize(
  page: Page,
  nthSizeButton: 1 | 2 | 3 | 4 | 5 | 6
) {
  // get the nth brush size button
  const btn = page.locator(
    `.line-width-panel > div:nth-child(${nthSizeButton})`
  );

  await btn.click();
}

export async function openComponentToolbarMoreMenu(page: Page) {
  const btn = page
    .locator('edgeless-component-toolbar edgeless-tool-icon-button')
    .filter({
      hasText: 'More',
    });

  await btn.click();
}

export async function clickComponentToolbarMoreMenuButton(
  page: Page,
  button: 'delete'
) {
  const text = {
    delete: 'Delete',
  }[button];

  const btn = locatorComponentToolbarMoreButton(page)
    .locator('.action-item')
    .filter({ hasText: text });

  await btn.click();
}

// stepX/Y may not equal to wheel event delta.
// Chromium reports deltaX/deltaY scaled by host device scale factor.
// https://bugs.chromium.org/p/chromium/issues/detail?id=1324819
export async function zoomByMouseWheel(
  page: Page,
  stepX: number,
  stepY: number
) {
  await page.keyboard.down(SHORT_KEY);
  await page.mouse.wheel(stepX, stepY);
  await page.keyboard.up(SHORT_KEY);
}

export async function zoomFitByKeyboard(page: Page) {
  await page.keyboard.press(`${SHORT_KEY}+1`, { delay: 50 });
}

export async function zoomOutByKeyboard(page: Page) {
  await page.keyboard.press(`${SHORT_KEY}+-`, { delay: 50 });
}

export async function zoomResetByKeyboard(page: Page) {
  await page.keyboard.press(`${SHORT_KEY}+0`, { delay: 50 });
}

export async function zoomInByKeyboard(page: Page) {
  await page.keyboard.press(`${SHORT_KEY}+=`, { delay: 50 });
}

export async function getZoomLevel(page: Page) {
  const span = page.locator('.zoom-percent');
  // fixme
  await waitNextFrame(page, 60 / 0.25);
  const text = await span.textContent();
  if (!text) {
    throw new Error('Missing .zoom-percent');
  }
  return Number(text.replace('%', ''));
}

export async function optionMouseDrag(page: Page, start: IPoint, end: IPoint) {
  await page.keyboard.down(MODIFIER_KEY);
  await dragBetweenCoords(page, start, end, { steps: 30 });
  await page.keyboard.up(MODIFIER_KEY);
}

export async function shiftClick(page: Page, point: IPoint) {
  await page.keyboard.down(SHIFT_KEY);
  await page.mouse.click(point.x, point.y);
  await page.keyboard.up(SHIFT_KEY);
}

export async function deleteAll(page: Page) {
  await selectAllByKeyboard(page);
  await pressBackspace(page);
}

export async function deleteAllConnectors(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    container.surface.getElementsByType('connector').forEach(c => {
      container.surface.removeElement(c.id);
    });
  });
}

export function locatorComponentToolbar(page: Page) {
  return page.locator('edgeless-component-toolbar');
}

function locatorComponentToolbarMoreButton(page: Page) {
  const moreButton = locatorComponentToolbar(page).locator(
    'edgeless-more-button'
  );
  return moreButton;
}
type Action =
  | 'bringToFront'
  | 'bringForward'
  | 'sendBackward'
  | 'sendToBack'
  | 'copyAsPng'
  | 'changeNoteColor'
  | 'changeShapeFillColor'
  | 'changeShapeStrokeColor'
  | 'changeShapeStrokeStyles'
  | 'changeConnectorStrokeColor'
  | 'changeConnectorStrokeStyles';

export async function triggerComponentToolbarAction(
  page: Page,
  action: Action
) {
  switch (action) {
    case 'bringToFront': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Bring to front',
        });
      await actionButton.click();
      break;
    }
    case 'bringForward': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Bring forward',
        });
      await actionButton.click();
      break;
    }
    case 'sendBackward': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Send backward',
        });
      await actionButton.click();
      break;
    }
    case 'sendToBack': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Send to back',
        });
      await actionButton.click();
      break;
    }
    case 'copyAsPng': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Copy as PNG',
        });
      await actionButton.click();
      break;
    }
    case 'changeNoteColor': {
      const button = locatorComponentToolbar(page).locator(
        'edgeless-change-note-button edgeless-tool-icon-button'
      );
      await button.click();
      break;
    }
    case 'changeShapeFillColor': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-shape-button')
        .locator('.fill-color-button');
      await button.click();
      break;
    }
    case 'changeShapeStrokeColor': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-shape-button')
        .locator('.stroke-color-button');
      await button.click();
      break;
    }
    case 'changeShapeStrokeStyles': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-shape-button')
        .locator('.line-styles-button');
      await button.click();
      break;
    }
    case 'changeConnectorStrokeColor': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-connector-button')
        .locator('.connector-color-button');
      await button.click();
      break;
    }
    case 'changeConnectorStrokeStyles': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-connector-button')
        .locator('.line-styles-button');
      await button.click();
      break;
    }
  }
}

export async function changeEdgelessNoteBackground(
  page: Page,
  color: CssVariableName
) {
  const colorButton = page.locator(
    `edgeless-change-note-button .color-unit[aria-label="${color}"]`
  );
  await colorButton.click();
}

export async function changeShapeFillColor(page: Page, color: CssVariableName) {
  const colorButton = page
    .locator('edgeless-change-shape-button')
    .locator('.color-panel-container.fill-color')
    .locator(`.color-unit[aria-label="${color}"]`);
  await colorButton.click();
}

export async function changeShapeStrokeColor(
  page: Page,
  color: CssVariableName
) {
  const colorButton = page
    .locator('edgeless-change-shape-button')
    .locator('.color-panel-container.stroke-color')
    .locator(`.color-unit[aria-label="${color}"]`);
  await colorButton.click();
}

export async function resizeConnectorByStartCapitalHandler(
  page: Page,
  delta: { x: number; y: number },
  steps = 1
) {
  const handler = page.locator(
    '.affine-edgeless-selected-rect .line-controller.line-start'
  );
  const box = await handler.boundingBox();
  if (box === null) throw new Error();
  const offset = 5;
  await dragBetweenCoords(
    page,
    { x: box.x + offset, y: box.y + offset },
    { x: box.x + delta.x + offset, y: box.y + delta.y + offset },
    {
      steps,
    }
  );
}

export function locatorShapeStrokeWidthButton(page: Page, size: 's' | 'l') {
  return page
    .locator('edgeless-change-shape-button')
    .locator('.line-style-panel')
    .locator(`.edgeless-component-line-size-button.size-${size}`);
}
export async function changeShapeStrokeWidth(page: Page, size: 's' | 'l') {
  const button = locatorShapeStrokeWidthButton(page, size);
  await button.click();
}

export function locatorShapeStrokeStyleButton(
  page: Page,
  mode: 'solid' | 'dash' | 'none'
) {
  return page
    .locator('edgeless-change-shape-button')
    .locator('.line-style-panel')
    .locator(`.edgeless-component-line-style-button.mode-${mode}`);
}
export async function changeShapeStrokeStyle(
  page: Page,
  mode: 'solid' | 'dash' | 'none'
) {
  const button = locatorShapeStrokeStyleButton(page, mode);
  await button.click();
}

export async function changeConnectorStrokeColor(
  page: Page,
  color: CssVariableName
) {
  const colorButton = page
    .locator('edgeless-change-connector-button')
    .locator('.color-panel-container')
    .locator(`.color-unit[aria-label="${color}"]`);
  await colorButton.click();
}

export function locatorConnectorStrokeWidthButton(page: Page, size: 's' | 'l') {
  return page
    .locator('edgeless-change-connector-button')
    .locator('.line-style-panel')
    .locator(`.edgeless-component-line-size-button.size-${size}`);
}
export async function changeConnectorStrokeWidth(page: Page, size: 's' | 'l') {
  const button = locatorConnectorStrokeWidthButton(page, size);
  await button.click();
}

export function locatorConnectorStrokeStyleButton(
  page: Page,
  mode: 'solid' | 'dash' | 'none'
) {
  return page
    .locator('edgeless-change-connector-button')
    .locator('.line-style-panel')
    .locator(`.edgeless-component-line-style-button.mode-${mode}`);
}
export async function changeConnectorStrokeStyle(
  page: Page,
  mode: 'solid' | 'dash' | 'none'
) {
  const button = locatorConnectorStrokeStyleButton(page, mode);
  await button.click();
}

export async function initThreeOverlapFilledShapes(page: Page) {
  const rect0 = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect0.start, rect0.end);
  await page.mouse.click(rect0.start.x + 5, rect0.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeFillColor');
  await changeShapeFillColor(page, '--affine-palette-shape-navy');

  const rect1 = {
    start: { x: 130, y: 130 },
    end: { x: 230, y: 230 },
  };
  await addBasicRectShapeElement(page, rect1.start, rect1.end);
  await page.mouse.click(rect1.start.x + 5, rect1.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeFillColor');
  await changeShapeFillColor(page, '--affine-palette-shape-black');

  const rect2 = {
    start: { x: 160, y: 160 },
    end: { x: 260, y: 260 },
  };
  await addBasicRectShapeElement(page, rect2.start, rect2.end);
  await page.mouse.click(rect2.start.x + 5, rect2.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeFillColor');
  await changeShapeFillColor(page, '--affine-palette-shape-white');
}

export async function initThreeOverlapNotes(page: Page) {
  await addNote(page, 'abc', 30 + 100, 40 + 100);
  await addNote(page, 'efg', 30 + 130, 40 + 100);
  await addNote(page, 'hij', 30 + 160, 40 + 100);
}

export async function initThreeNotes(page: Page) {
  await addNote(page, 'abc', 30 + 100, 40 + 100);
  await addNote(page, 'efg', 30 + 130, 40 + 200);
  await addNote(page, 'hij', 30 + 160, 40 + 300);
}

export async function toViewCoord(page: Page, point: number[]) {
  return await page.evaluate(point => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface.viewport.toViewCoord(point[0], point[1]);
  }, point);
}

export async function toModelCoord(page: Page, point: number[]) {
  return await page.evaluate(point => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface.viewport.toModelCoord(point[0], point[1]);
  }, point);
}

export async function getConnectorSourceConnection(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface.getElementsByType('connector')[0].source;
  });
}

export async function getConnectorPath(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    const connectors = container.surface.getElementsByType('connector');
    return connectors[0].absolutePath;
  });
}
