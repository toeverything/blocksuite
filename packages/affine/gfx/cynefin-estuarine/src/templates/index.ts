import {
  makeTemplateSnapshot,
  type SurfaceElementsJSON,
  surfaceText,
  type Template,
  type TemplateCategory,
} from '@labre/affine-gfx-template';
import { FontFamily, ShapeStyle, TextAlign } from '@labre/affine-model';

import { REF_H as CYN_H, REF_W as CYN_W } from '../cynefin/consts';
import { REF_H as EST_H, REF_W as EST_W } from '../estuarine/consts';

const HEX_SIZE = 60;
const HEX_FILL = '#34c724';
const HEX_STROKE = '#1f1f1f';
const HEX_VERTICES = [
  [1, 0.5],
  [0.75, 0.933],
  [0.25, 0.933],
  [0, 0.5],
  [0.25, 0.067],
  [0.75, 0.067],
];

function sticky(x: number, y: number, text: string) {
  return {
    type: 'shape',
    shapeType: 'rect',
    filled: true,
    fillColor: '#fff3b0',
    strokeColor: '#d9b740',
    strokeWidth: 1.5,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    radius: 8,
    text: surfaceText(text),
    color: '#1a1a1a',
    fontFamily: FontFamily.Inter,
    fontSize: 18,
    textAlign: TextAlign.Center,
    xywh: `[${x},${y},200,70]`,
  };
}

function hexagon(x: number, y: number) {
  return {
    type: 'shape',
    shapeType: 'polygon',
    vertices: HEX_VERTICES,
    filled: true,
    fillColor: HEX_FILL,
    strokeColor: HEX_STROKE,
    strokeWidth: 2,
    shapeStyle: ShapeStyle.General,
    roughness: 0,
    xywh: `[${x},${y},${HEX_SIZE},${HEX_SIZE}]`,
  };
}

function caption(x: number, y: number, str: string) {
  return {
    type: 'text',
    text: surfaceText(str),
    color: '#1a1a1a',
    fontFamily: FontFamily.Inter,
    fontSize: 16,
    textAlign: TextAlign.Center,
    xywh: `[${x},${y},120,24]`,
  };
}

function tpl(name: string, preview: string, elements: SurfaceElementsJSON): Template {
  return { name, type: 'template', preview, content: makeTemplateSnapshot(elements, name) };
}

const ATTRS = 'width="100%" height="100%" viewBox="0 0 135 80" xmlns="http://www.w3.org/2000/svg"';

const cynefinBg = (xywh: string) => ({ type: 'cynefin', xywh });
const estuarineBg = (xywh: string) => ({ type: 'estuarine', xywh });

export const cynefinTemplateCategory: TemplateCategory = {
  name: 'Cynefin',
  templates: [
    tpl(
      'Decision sorting',
      `<svg ${ATTRS} fill="none"><rect x="8" y="10" width="119" height="60" rx="4" stroke="#2a9d99" stroke-width="1.5"/><path d="M67 10 V70 M8 40 H127" stroke="#9aa0a6"/><rect x="18" y="18" width="34" height="14" rx="2" fill="#fff3b0"/><rect x="83" y="18" width="34" height="14" rx="2" fill="#fff3b0"/><rect x="18" y="48" width="34" height="14" rx="2" fill="#fff3b0"/><rect x="83" y="48" width="34" height="14" rx="2" fill="#fff3b0"/></svg>`,
      {
        bg: cynefinBg(`[0,0,${CYN_W},${CYN_H}]`),
        s1: sticky(190, 175, 'Probe & learn'),
        s2: sticky(690, 175, 'Expert analysis'),
        s3: sticky(190, 505, 'Act now'),
        s4: sticky(690, 505, 'Known issue'),
      }
    ),
    tpl(
      'Cynefin framework',
      `<svg ${ATTRS} fill="none"><rect x="14" y="12" width="107" height="56" rx="4" stroke="#2a9d99" stroke-width="1.6"/><path d="M67 12 V68 M14 40 H121" stroke="#9aa0a6"/></svg>`,
      { bg: cynefinBg(`[0,0,${CYN_W},${CYN_H}]`) }
    ),
  ],
};

export const estuarineTemplateCategory: TemplateCategory = {
  name: 'Estuarine',
  templates: [
    tpl(
      'Constraint map',
      `<svg ${ATTRS} fill="none"><path d="M20 12 V70 M20 70 H120" stroke="#941253" stroke-width="2"/><g fill="#34c724" stroke="#1f1f1f"><path d="M44 28 l6 4 l0 8 l-6 4 l-6 -4 l0 -8 z"/><path d="M74 40 l6 4 l0 8 l-6 4 l-6 -4 l0 -8 z"/><path d="M56 52 l6 4 l0 8 l-6 4 l-6 -4 l0 -8 z"/></g></svg>`,
      {
        bg: estuarineBg(`[0,0,${EST_W},${EST_H}]`),
        h1: hexagon(150, 220),
        c1: caption(120, 284, 'Policy'),
        h2: hexagon(330, 360),
        c2: caption(300, 424, 'Habit'),
        h3: hexagon(230, 520),
        c3: caption(200, 584, 'Budget'),
      }
    ),
    tpl(
      'Estuarine map',
      `<svg ${ATTRS} fill="none"><path d="M24 10 V70 M24 70 H120" stroke="#941253" stroke-width="2.4"/><path d="M30 52 q40 -30 84 -34" stroke="#5ecc44" stroke-width="2" fill="none"/></svg>`,
      { bg: estuarineBg(`[0,0,${EST_W},${EST_H}]`) }
    ),
    tpl(
      'Hexagon constraint',
      `<svg ${ATTRS} fill="none"><path d="M67 24 l18 11 l0 22 l-18 11 l-18 -11 l0 -22 z" fill="#34c724" stroke="#1f1f1f" stroke-width="2"/></svg>`,
      { hex: hexagon(0, 0) }
    ),
  ],
};
