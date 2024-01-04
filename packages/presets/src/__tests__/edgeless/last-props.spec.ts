import type {
  BrushElement,
  ConnectorElement,
  ShapeElement,
  TextElement,
} from '@blocksuite/blocks';
import { type SurfaceBlockComponent } from '@blocksuite/blocks';
import { beforeEach, describe, expect, test } from 'vitest';

import { getSurface } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('apply last props', () => {
  let surface!: SurfaceBlockComponent;

  beforeEach(async () => {
    sessionStorage.removeItem('blocksuite:prop:record');
    const cleanup = await setupEditor('edgeless');
    surface = getSurface(window.page, window.editor);
    return cleanup;
  });

  test('shape', async () => {
    const id = surface.addElement('shape', { shapeType: 'rect' });
    const shape = surface.pickById(id) as ShapeElement;
    expect(shape.fillColor).toBe('--affine-palette-shape-yellow');
    expect(shape.strokeColor).toBe('--affine-palette-line-yellow');
    expect(shape.shapeStyle).toBe('General');
    surface.updateElement(id, { fillColor: '--affine-palette-shape-orange' });
    const secondShape = surface.pickById(
      surface.addElement('shape', { shapeType: 'rect' })
    ) as ShapeElement;
    expect(secondShape.fillColor).toBe('--affine-palette-shape-orange');
  });

  test('connector', async () => {
    const id = surface.addElement('connector', { mode: 0 });
    const connector = surface.pickById(id) as ConnectorElement;
    expect(connector.stroke).toBe('--affine-palette-line-black');
    expect(connector.strokeWidth).toBe(2);
    expect(connector.strokeStyle).toBe('solid');
    expect(connector.frontEndpointStyle).toBe('None');
    expect(connector.rearEndpointStyle).toBe('Arrow');
    surface.updateElement(id, { strokeWidth: 10 });
    const secondConnector = surface.pickById(
      surface.addElement('connector', { mode: 1 })
    ) as ShapeElement;
    expect(secondConnector.strokeWidth).toBe(10);
  });

  test('brush', async () => {
    const id = surface.addElement('brush', {});
    const brush = surface.pickById(id) as BrushElement;
    expect(brush.color).toBe('--affine-palette-line-black');
    expect(brush.lineWidth).toBe(4);
    surface.updateElement(id, { lineWidth: 10 });
    const secondBrush = surface.pickById(
      surface.addElement('brush', {})
    ) as BrushElement;
    expect(secondBrush.lineWidth).toBe(10);
  });

  test('text', async () => {
    const id = surface.addElement('text', {});
    const text = surface.pickById(id) as TextElement;
    expect(text.fontSize).toBe(24);
    surface.updateElement(id, { fontSize: 36 });
    const secondText = surface.pickById(
      surface.addElement('text', {})
    ) as TextElement;
    expect(secondText.fontSize).toBe(36);
  });
});
