import type { BlockStdScope } from '@blocksuite/block-std';

import {
  type BrushElementModel,
  type ConnectorElementModel,
  DEFAULT_NOTE_BACKGROUND_COLOR,
  DEFAULT_NOTE_SHADOW,
  DEFAULT_TEXT_COLOR,
  type EdgelessRootBlockComponent,
  type EdgelessTextBlockModel,
  EditPropsStore,
  FontFamily,
  FrameBackgroundColor,
  type FrameBlockModel,
  getSurfaceBlock,
  LayoutType,
  LineColor,
  type MindmapElementModel,
  MindmapStyle,
  NoteBackgroundColor,
  type NoteBlockModel,
  NoteShadow,
  type ShapeElementModel,
  ShapeFillColor,
  ShapeType,
  type TextElementModel,
} from '@blocksuite/blocks';
import { beforeEach, describe, expect, test } from 'vitest';

import { getDocRootBlock } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('apply last props', () => {
  let edgelessRoot!: EdgelessRootBlockComponent;
  let service!: EdgelessRootBlockComponent['service'];
  let std!: BlockStdScope;

  beforeEach(async () => {
    sessionStorage.removeItem('blocksuite:prop:record');
    const cleanup = await setupEditor('edgeless');
    edgelessRoot = getDocRootBlock(window.doc, window.editor, 'edgeless');
    service = edgelessRoot.service;
    std = edgelessRoot.std;
    return cleanup;
  });

  test('shapes', () => {
    // rect shape
    const rectId = service.addElement('shape', { shapeType: ShapeType.Rect });
    const rectShape = service.getElementById(rectId) as ShapeElementModel;
    expect(rectShape.fillColor).toBe(ShapeFillColor.Yellow);
    service.updateElement(rectId, {
      fillColor: ShapeFillColor.Orange,
    });
    expect(
      std.get(EditPropsStore).lastProps$.value[`shape:${ShapeType.Rect}`]
        .fillColor
    ).toBe(ShapeFillColor.Orange);

    // diamond shape
    const diamondId = service.addElement('shape', {
      shapeType: ShapeType.Diamond,
    });
    const diamondShape = service.getElementById(diamondId) as ShapeElementModel;
    expect(diamondShape.fillColor).toBe(ShapeFillColor.Yellow);
    service.updateElement(diamondId, {
      fillColor: ShapeFillColor.Blue,
    });
    expect(
      std.get(EditPropsStore).lastProps$.value[`shape:${ShapeType.Diamond}`]
        .fillColor
    ).toBe(ShapeFillColor.Blue);

    // rounded rect shape
    const roundedRectId = service.addElement('shape', {
      shapeType: ShapeType.Rect,
      radius: 0.1,
    });
    const roundedRectShape = service.getElementById(
      roundedRectId
    ) as ShapeElementModel;
    expect(roundedRectShape.fillColor).toBe(ShapeFillColor.Yellow);
    service.updateElement(roundedRectId, {
      fillColor: ShapeFillColor.Green,
    });
    expect(
      std.get(EditPropsStore).lastProps$.value['shape:roundedRect'].fillColor
    ).toBe(ShapeFillColor.Green);

    // apply last props
    const rectId2 = service.addElement('shape', { shapeType: ShapeType.Rect });
    const rectShape2 = service.getElementById(rectId2) as ShapeElementModel;
    expect(rectShape2.fillColor).toBe(ShapeFillColor.Orange);

    const diamondId2 = service.addElement('shape', {
      shapeType: ShapeType.Diamond,
    });
    const diamondShape2 = service.getElementById(
      diamondId2
    ) as ShapeElementModel;
    expect(diamondShape2.fillColor).toBe(ShapeFillColor.Blue);

    const roundedRectId2 = service.addElement('shape', {
      shapeType: ShapeType.Rect,
      radius: 0.1,
    });
    const roundedRectShape2 = service.getElementById(
      roundedRectId2
    ) as ShapeElementModel;
    expect(roundedRectShape2.fillColor).toBe(ShapeFillColor.Green);
  });

  test('connector', () => {
    const id = service.addElement('connector', { mode: 0 });
    const connector = service.getElementById(id) as ConnectorElementModel;
    expect(connector.stroke).toBe(LineColor.Grey);
    expect(connector.strokeWidth).toBe(2);
    expect(connector.strokeStyle).toBe('solid');
    expect(connector.frontEndpointStyle).toBe('None');
    expect(connector.rearEndpointStyle).toBe('Arrow');
    service.updateElement(id, { strokeWidth: 10 });

    const id2 = service.addElement('connector', { mode: 1 });
    const connector2 = service.getElementById(id2) as ConnectorElementModel;
    expect(connector2.strokeWidth).toBe(10);
    service.updateElement(id2, {
      labelStyle: {
        color: LineColor.Magenta,
        fontFamily: FontFamily.Kalam,
      },
    });

    const id3 = service.addElement('connector', { mode: 1 });
    const connector3 = service.getElementById(id3) as ConnectorElementModel;
    expect(connector3.strokeWidth).toBe(10);
    expect(connector3.labelStyle.color).toBe(LineColor.Magenta);
    expect(connector3.labelStyle.fontFamily).toBe(FontFamily.Kalam);
  });

  test('brush', () => {
    const id = service.addElement('brush', {});
    const brush = service.getElementById(id) as BrushElementModel;
    expect(brush.color).toEqual({
      dark: LineColor.White,
      light: LineColor.Black,
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

  test('mindmap', () => {
    const id = service.addElement('mindmap', {});
    const mindmap = service.getElementById(id) as MindmapElementModel;
    expect(mindmap.layoutType).toBe(LayoutType.RIGHT);
    expect(mindmap.style).toBe(MindmapStyle.ONE);
    service.updateElement(id, {
      layoutType: LayoutType.BALANCE,
      style: MindmapStyle.THREE,
    });

    const id2 = service.addElement('mindmap', {});
    const mindmap2 = service.getElementById(id2) as MindmapElementModel;
    expect(mindmap2.layoutType).toBe(LayoutType.BALANCE);
    expect(mindmap2.style).toBe(MindmapStyle.THREE);
  });

  test('edgeless-text', () => {
    const surface = getSurfaceBlock(doc);
    const id = service.addBlock('affine:edgeless-text', {}, surface!.id);
    const text = service.getElementById(id) as EdgelessTextBlockModel;
    expect(text.color).toBe(DEFAULT_TEXT_COLOR);
    expect(text.fontFamily).toBe(FontFamily.Inter);
    service.updateElement(id, {
      color: LineColor.Green,
      fontFamily: FontFamily.OrelegaOne,
    });

    const id2 = service.addBlock('affine:edgeless-text', {}, surface!.id);
    const text2 = service.getElementById(id2) as EdgelessTextBlockModel;
    expect(text2.color).toBe(LineColor.Green);
    expect(text2.fontFamily).toBe(FontFamily.OrelegaOne);
  });

  test('note', () => {
    const id = service.addBlock('affine:note', {}, doc.root!.id);
    const note = service.getElementById(id) as NoteBlockModel;
    expect(note.background).toBe(DEFAULT_NOTE_BACKGROUND_COLOR);
    expect(note.edgeless.style.shadowType).toBe(DEFAULT_NOTE_SHADOW);
    service.updateElement(id, {
      background: NoteBackgroundColor.Purple,
      edgeless: {
        style: {
          shadowType: NoteShadow.Film,
        },
      },
    });

    const id2 = service.addBlock('affine:note', {}, doc.root!.id);
    const note2 = service.getElementById(id2) as NoteBlockModel;
    expect(note2.background).toBe(NoteBackgroundColor.Purple);
    expect(note2.edgeless.style.shadowType).toBe(NoteShadow.Film);
  });

  test('frame', () => {
    const surface = getSurfaceBlock(doc);
    const id = service.addBlock('affine:frame', {}, surface!.id);
    const note = service.getElementById(id) as FrameBlockModel;
    expect(note.background).toBe('--affine-palette-transparent');
    service.updateElement(id, {
      background: FrameBackgroundColor.Purple,
    });

    const id2 = service.addBlock('affine:frame', {}, surface!.id);
    const frame2 = service.getElementById(id2) as FrameBlockModel;
    expect(frame2.background).toBe(FrameBackgroundColor.Purple);
    service.updateElement(id, {
      background: { normal: '#def4e740' },
    });

    const id3 = service.addBlock('affine:frame', {}, surface!.id);
    const frame3 = service.getElementById(id3) as FrameBlockModel;
    expect(frame3.background).toEqual({ normal: '#def4e740' });
    service.updateElement(id, {
      background: { light: '#a381aa23', dark: '#6e907452' },
    });

    const id4 = service.addBlock('affine:frame', {}, surface!.id);
    const frame4 = service.getElementById(id4) as FrameBlockModel;
    expect(frame4.background).toEqual({
      light: '#a381aa23',
      dark: '#6e907452',
    });
  });
});
