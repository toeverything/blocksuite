import { type TemplateResult, render } from 'lit';

import type { ShapeTool } from '../../../controllers/tools/shape-tool.js';

type TransformState = {
  /** scale */
  s?: number;
  /** horizental offset base on center */
  x?: number | string;
  /** vertical offset base on center */
  y?: number | string;
  /** z-index */
  z?: number;
};

export type DraggableShape = {
  name: ShapeTool['shapeType'];
  style: {
    default?: TransformState;
    hover?: TransformState;
    /**
     * The next shape when previous shape is dragged outside toolbar
     */
    next?: TransformState;
  };
  svg: TemplateResult;
};

/**
 * Helper function to build the CSS variables object for the shape
 * @returns
 */
export const buildVariablesObject = (style: DraggableShape['style']) => {
  const states: Array<keyof DraggableShape['style']> = [
    'default',
    'hover',
    'next',
  ];
  const variables: Array<keyof TransformState> = ['x', 'y', 's', 'z'];

  const resolveValue = (
    variable: keyof TransformState,
    value: number | string
  ) => {
    if (['x', 'y'].includes(variable)) {
      return typeof value === 'number' ? `${value}px` : value;
    }
    return value;
  };

  return states.reduce((acc, state) => {
    return {
      ...acc,
      ...variables.reduce((acc, variable) => {
        const defaultValue = style.default?.[variable];
        const value = style[state]?.[variable] ?? defaultValue;
        if (value === undefined) return acc;
        return {
          ...acc,
          [`--${state}-${variable}`]: resolveValue(variable, value),
        };
      }, {}),
    };
  }, {});
};

// drag helper
export type ShapeDragEvent = {
  el: HTMLElement;
  inputType: 'mouse' | 'touch';
  originalEvent: MouseEvent | TouchEvent;
  x: number;
  y: number;
};

export const touchResolver = (event: TouchEvent) =>
  ({
    el: event.currentTarget as HTMLElement,
    inputType: 'touch',
    originalEvent: event,
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
  }) satisfies ShapeDragEvent;

export const mouseResolver = (event: MouseEvent) =>
  ({
    el: event.currentTarget as HTMLElement,
    inputType: 'mouse',
    originalEvent: event,
    x: event.clientX,
    y: event.clientY,
  }) satisfies ShapeDragEvent;

// overlay helper
export const defaultDraggingInfo = {
  edgelessRect: {} as DOMRect,
  moved: false,
  parentToMount: null as unknown as HTMLElement,
  shape: null as unknown as DraggableShape,
  shapeEl: null as unknown as HTMLElement,
  shapeRectOriginal: {} as DOMRect,
  startPos: { x: 0, y: 0 },
  style: {} as CSSStyleDeclaration,
  toolbarRect: {} as DOMRect,
};
export type DraggingInfo = typeof defaultDraggingInfo;

export const createShapeDraggingOverlay = (info: DraggingInfo) => {
  const { edgelessRect, parentToMount } = info;
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    // height: toolbarRect.bottom - edgelessRect.top + 'px',
    height: edgelessRect.height + 'px',
    left: '0',
    overflow: 'hidden',
    position: 'absolute',
    // always clip
    top: '0',
    width: edgelessRect.width + 'px',
    zIndex: '9999',

    // for debug purpose
    // background: 'rgba(255, 0, 0, 0.1)',
  });

  const shape = document.createElement('div');
  const shapeScaleWrapper = document.createElement('div');
  Object.assign(shapeScaleWrapper.style, {
    transform: 'scale(var(--s, 1))',
    transformOrigin: 'var(--o, center)',
    transition: 'transform 0.1s',
  });
  render(info.shape.svg, shapeScaleWrapper);
  Object.assign(shape.style, {
    color: info.style.color,
    cursor: 'grabbing',
    filter: `var(--shape-filter, ${info.style.filter})`,
    left: 'var(--left, 0)',
    position: 'absolute',
    stroke: info.style.stroke,
    top: 'var(--top, 0)',
    transform: 'translate(var(--x, 0), var(--y, 0))',
    transition: 'inherit',
  });

  shape.append(shapeScaleWrapper);
  overlay.append(shape);
  parentToMount.append(overlay);

  return overlay;
};
