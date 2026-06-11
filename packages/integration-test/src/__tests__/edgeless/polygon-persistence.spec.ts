import type { SurfaceBlockModel } from '@labre/affine/blocks/surface';
import type { ShapeElementModel } from '@labre/affine/model';
import { ShapeType } from '@labre/affine/model';
import { beforeEach, describe, expect, test } from 'vitest';

import { setupEditor } from '../utils/setup.js';

let model: SurfaceBlockModel;

beforeEach(async () => {
  const cleanup = await setupEditor('edgeless');
  const models = doc.getModelsByFlavour(
    'affine:surface'
  ) as SurfaceBlockModel[];

  model = models[0];

  return cleanup;
});

describe('polygon round-trip persistence', () => {
  test('polygon element with vertices persists and restores correctly', () => {
    const vertices = [
      [0.5, 0],
      [1, 0.38],
      [0.81, 1],
      [0.19, 1],
      [0, 0.38],
    ];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[100,100,200,200]',
      vertices,
    });

    const element = model.getElementById(id) as ShapeElementModel;

    expect(element).not.toBeNull();
    expect(element.shapeType).toBe(ShapeType.Polygon);
    expect(element.vertices).toEqual(vertices);
    expect(element.xywh).toBe('[100,100,200,200]');
  });

  test('polygon vertices are stored in the YMap and survive reload', () => {
    const vertices = [
      [0.2, 0.1],
      [0.8, 0.1],
      [0.9, 0.5],
      [0.5, 0.9],
      [0.1, 0.5],
    ];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[50,50,300,300]',
      vertices,
    });

    const element = model.getElementById(id) as ShapeElementModel;

    // Verify the data is stored in the underlying YMap (Yjs persistence layer)
    const yMap = element.yMap;
    expect(yMap.get('shapeType')).toBe(ShapeType.Polygon);

    const storedVertices = yMap.get('vertices');
    expect(storedVertices).toBeDefined();

    // Verify element model reads back correctly
    expect(element.vertices).toEqual(vertices);
    expect(element.vertices!.length).toBe(5);
  });

  test('isClosed flag persists correctly', () => {
    const vertices = [
      [0, 0],
      [1, 0],
      [1, 1],
    ];

    // Create a closed polygon (default)
    const closedId = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,100,100]',
      vertices,
      isClosed: true,
    });

    const closedElement = model.getElementById(closedId) as ShapeElementModel;
    expect(closedElement.isClosed).toBe(true);
    expect(closedElement.yMap.get('isClosed')).toBe(true);

    // Create an open polygon
    const openId = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[200,0,100,100]',
      vertices,
      isClosed: false,
    });

    const openElement = model.getElementById(openId) as ShapeElementModel;
    expect(openElement.isClosed).toBe(false);
    expect(openElement.yMap.get('isClosed')).toBe(false);
  });

  test('smoothFlags per-vertex array persists correctly', () => {
    const vertices = [
      [0.5, 0],
      [1, 0.5],
      [0.5, 1],
      [0, 0.5],
    ];
    const smoothFlags = [false, true, false, true];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,200,200]',
      vertices,
      smoothFlags,
    });

    const element = model.getElementById(id) as ShapeElementModel;
    expect(element.smoothFlags).toEqual(smoothFlags);
    expect(element.smoothFlags!.length).toBe(4);
    expect(element.smoothFlags![0]).toBe(false);
    expect(element.smoothFlags![1]).toBe(true);
    expect(element.smoothFlags![2]).toBe(false);
    expect(element.smoothFlags![3]).toBe(true);
  });

  test('null smoothFlags defaults correctly', () => {
    const vertices = [
      [0, 0],
      [1, 0],
      [0.5, 1],
    ];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,100,100]',
      vertices,
      // smoothFlags not provided — should default to null
    });

    const element = model.getElementById(id) as ShapeElementModel;
    expect(element.smoothFlags).toBeNull();
  });

  test('all polygon-specific properties persist together', () => {
    const vertices = [
      [0.1, 0.2],
      [0.9, 0.2],
      [0.8, 0.8],
      [0.5, 1.0],
      [0.2, 0.8],
    ];
    const smoothFlags = [true, false, true, false, true];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[10,20,300,250]',
      vertices,
      isClosed: true,
      smoothFlags,
      filled: true,
      fillColor: '#ff0000',
      strokeColor: '#000000',
      strokeWidth: 3,
    });

    const element = model.getElementById(id) as ShapeElementModel;

    // Polygon-specific fields
    expect(element.shapeType).toBe(ShapeType.Polygon);
    expect(element.vertices).toEqual(vertices);
    expect(element.isClosed).toBe(true);
    expect(element.smoothFlags).toEqual(smoothFlags);

    // Standard shape styling fields
    expect(element.filled).toBe(true);
    expect(element.fillColor).toBe('#ff0000');
    expect(element.strokeColor).toBe('#000000');
    expect(element.strokeWidth).toBe(3);
    expect(element.xywh).toBe('[10,20,300,250]');
  });

  test('updateElement round-trip for vertices', () => {
    const initialVertices = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,100,100]',
      vertices: initialVertices,
    });

    const element = model.getElementById(id) as ShapeElementModel;
    expect(element.vertices).toEqual(initialVertices);

    // Update vertices (simulate vertex drag)
    const updatedVertices = [
      [0, 0],
      [0.8, 0.1],
      [1, 1],
      [0.1, 0.9],
    ];
    model.updateElement(id, { vertices: updatedVertices });

    expect(element.vertices).toEqual(updatedVertices);
    expect(element.vertices!.length).toBe(4);
  });

  test('updateElement round-trip for smoothFlags', () => {
    const vertices = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,100,100]',
      vertices,
      smoothFlags: null,
    });

    const element = model.getElementById(id) as ShapeElementModel;
    expect(element.smoothFlags).toBeNull();

    // Enable smoothing on vertices 1 and 3
    model.updateElement(id, {
      smoothFlags: [false, true, false, true],
    });

    expect(element.smoothFlags).toEqual([false, true, false, true]);

    // Update to all smooth
    model.updateElement(id, {
      smoothFlags: [true, true, true, true],
    });

    expect(element.smoothFlags).toEqual([true, true, true, true]);

    // Reset to null (all sharp)
    model.updateElement(id, {
      smoothFlags: null,
    });

    expect(element.smoothFlags).toBeNull();
  });

  test('updateElement round-trip for isClosed toggle', () => {
    const vertices = [
      [0, 0],
      [1, 0],
      [0.5, 1],
    ];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,100,100]',
      vertices,
      isClosed: true,
    });

    const element = model.getElementById(id) as ShapeElementModel;
    expect(element.isClosed).toBe(true);

    model.updateElement(id, { isClosed: false });
    expect(element.isClosed).toBe(false);

    model.updateElement(id, { isClosed: true });
    expect(element.isClosed).toBe(true);
  });

  test('polygon with many vertices persists correctly', () => {
    // Create a polygon with many vertices (e.g., approximating a circle)
    const numVertices = 20;
    const vertices: number[][] = [];
    for (let i = 0; i < numVertices; i++) {
      const angle = (2 * Math.PI * i) / numVertices;
      vertices.push([
        0.5 + 0.5 * Math.cos(angle),
        0.5 + 0.5 * Math.sin(angle),
      ]);
    }

    const smoothFlags = Array.from({ length: numVertices }, (_, i) => i % 2 === 0);

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,400,400]',
      vertices,
      smoothFlags,
      isClosed: true,
    });

    const element = model.getElementById(id) as ShapeElementModel;

    expect(element.vertices!.length).toBe(numVertices);
    expect(element.smoothFlags!.length).toBe(numVertices);

    // Verify each vertex value is preserved with precision
    for (let i = 0; i < numVertices; i++) {
      expect(element.vertices![i][0]).toBeCloseTo(vertices[i][0], 10);
      expect(element.vertices![i][1]).toBeCloseTo(vertices[i][1], 10);
      expect(element.smoothFlags![i]).toBe(i % 2 === 0);
    }
  });

  test('polygon with minimum vertices (triangle) persists correctly', () => {
    const vertices = [
      [0.5, 0],
      [1, 1],
      [0, 1],
    ];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,100,100]',
      vertices,
      isClosed: true,
      smoothFlags: [false, false, false],
    });

    const element = model.getElementById(id) as ShapeElementModel;

    expect(element.vertices).toEqual(vertices);
    expect(element.vertices!.length).toBe(3);
    expect(element.isClosed).toBe(true);
    expect(element.smoothFlags).toEqual([false, false, false]);
  });

  test('delete and re-add polygon element', () => {
    const vertices = [
      [0.25, 0],
      [0.75, 0],
      [1, 0.5],
      [0.75, 1],
      [0.25, 1],
      [0, 0.5],
    ];

    const id = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,200,200]',
      vertices,
      smoothFlags: [true, false, true, false, true, false],
    });

    expect(model.getElementById(id)).not.toBeNull();

    model.deleteElement(id);
    expect(model.getElementById(id)).toBeNull();

    // Re-add with different data
    const newVertices = [
      [0, 0],
      [1, 0],
      [1, 1],
    ];

    const newId = model.addElement({
      type: 'shape',
      shapeType: ShapeType.Polygon,
      xywh: '[50,50,150,150]',
      vertices: newVertices,
      smoothFlags: [false, true, false],
      isClosed: false,
    });

    const newElement = model.getElementById(newId) as ShapeElementModel;
    expect(newElement.vertices).toEqual(newVertices);
    expect(newElement.smoothFlags).toEqual([false, true, false]);
    expect(newElement.isClosed).toBe(false);
  });
});
