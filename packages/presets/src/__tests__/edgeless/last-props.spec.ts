import {
  ShapeType,
  type BrushElementModel,
  type ConnectorElementModel,
  type EdgelessRootBlockComponent,
  type ShapeElementModel,
  type TextElementModel,
} from '@blocksuite/blocks';
import { beforeEach, describe, expect, test } from 'vitest';

import { getDocRootBlock } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('apply last props', () => {
  let edgelessRoot!: EdgelessRootBlockComponent;
  let service!: EdgelessRootBlockComponent['service'];

  beforeEach(async () => {
    sessionStorage.removeItem('blocksuite:prop:record');
    const cleanup = await setupEditor('edgeless');
    edgelessRoot = getDocRootBlock(window.doc, window.editor, 'edgeless');
    service = edgelessRoot.service;
    return cleanup;
  });

  test('shapes', () => {
    // rect shape
    const rectId = service.addElement('shape', { shapeType: ShapeType.Rect });
    const rectShape = service.getElementById(rectId) as ShapeElementModel;
    expect(rectShape.fillColor).toBe('--affine-palette-shape-yellow');
    service.updateElement(rectId, {
      fillColor: '--affine-palette-shape-orange',
    });
    expect(
      service.editPropsStore.lastProps$.value[`shape:${ShapeType.Rect}`]
        .fillColor
    ).toBe('--affine-palette-shape-orange');

    // diamond shape
    const diamondId = service.addElement('shape', {
      shapeType: ShapeType.Diamond,
    });
    const diamondShape = service.getElementById(diamondId) as ShapeElementModel;
    expect(diamondShape.fillColor).toBe('--affine-palette-shape-yellow');
    service.updateElement(diamondId, {
      fillColor: '--affine-palette-shape-blue',
    });
    expect(
      service.editPropsStore.lastProps$.value[`shape:${ShapeType.Diamond}`]
        .fillColor
    ).toBe('--affine-palette-shape-blue');

    // rounded rect shape
    const roundedRectId = service.addElement('shape', {
      shapeType: ShapeType.Rect,
      radius: 0.1,
    });
    const roundedRectShape = service.getElementById(
      roundedRectId
    ) as ShapeElementModel;
    expect(roundedRectShape.fillColor).toBe('--affine-palette-shape-yellow');
    service.updateElement(roundedRectId, {
      fillColor: '--affine-palette-shape-green',
    });
    expect(
      service.editPropsStore.lastProps$.value['shape:roundedRect'].fillColor
    ).toBe('--affine-palette-shape-green');

    // apply last props
    const rectId2 = service.addElement('shape', { shapeType: ShapeType.Rect });
    const rectShape2 = service.getElementById(rectId2) as ShapeElementModel;
    expect(rectShape2.fillColor).toBe('--affine-palette-shape-orange');

    const diamondId2 = service.addElement('shape', {
      shapeType: ShapeType.Diamond,
    });
    const diamondShape2 = service.getElementById(
      diamondId2
    ) as ShapeElementModel;
    expect(diamondShape2.fillColor).toBe('--affine-palette-shape-blue');

    const roundedRectId2 = service.addElement('shape', {
      shapeType: ShapeType.Rect,
      radius: 0.1,
    });
    const droundedRectShape2 = service.getElementById(
      roundedRectId2
    ) as ShapeElementModel;
    expect(droundedRectShape2.fillColor).toBe('--affine-palette-shape-green');
  });

  test('connector', () => {
    const id = service.addElement('connector', { mode: 0 });
    const connector = service.getElementById(id) as ConnectorElementModel;
    expect(connector.stroke).toBe('--affine-palette-line-grey');
    expect(connector.strokeWidth).toBe(2);
    expect(connector.strokeStyle).toBe('solid');
    expect(connector.frontEndpointStyle).toBe('None');
    expect(connector.rearEndpointStyle).toBe('Arrow');
    service.updateElement(id, { strokeWidth: 10 });
    const secondConnector = service.getElementById(
      service.addElement('connector', { mode: 1 })
    ) as ShapeElementModel;
    expect(secondConnector.strokeWidth).toBe(10);
  });

  test('brush', () => {
    const id = service.addElement('brush', {});
    const brush = service.getElementById(id) as BrushElementModel;
    expect(brush.color).toEqual({
      dark: '--affine-palette-line-white',
      light: '--affine-palette-line-black',
    });
    expect(brush.lineWidth).toBe(4);
    service.updateElement(id, { lineWidth: 10 });
    const secondBrush = service.getElementById(
      service.addElement('brush', {})
    ) as BrushElementModel;
    expect(secondBrush.lineWidth).toBe(10);
  });

  test('text', () => {
    const id = service.addElement('text', {});
    const text = service.getElementById(id) as TextElementModel;
    expect(text.fontSize).toBe(24);
    service.updateElement(id, { fontSize: 36 });
    const secondText = service.getElementById(
      service.addElement('text', {})
    ) as TextElementModel;
    expect(secondText.fontSize).toBe(36);
  });
});
