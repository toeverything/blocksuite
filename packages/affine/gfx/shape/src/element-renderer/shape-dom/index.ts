import type { DomRenderer } from '@blocksuite/affine-block-surface';
import type { ShapeElementModel } from '@blocksuite/affine-model';
import { DefaultTheme } from '@blocksuite/affine-model';

import { manageClassNames, setStyles } from './utils';

function applyShapeSpecificStyles(
  model: ShapeElementModel,
  element: HTMLElement,
  zoom: number
) {
  if (model.shapeType === 'rect') {
    const w = model.w * zoom;
    const h = model.h * zoom;
    const r = model.radius ?? 0;
    const borderRadius =
      r < 1 ? `${Math.min(w * r, h * r)}px` : `${r * zoom}px`;
    element.style.borderRadius = borderRadius;
  } else if (model.shapeType === 'ellipse') {
    element.style.borderRadius = '50%';
  } else {
    element.style.borderRadius = '';
  }
}

function applyBorderStyles(
  model: ShapeElementModel,
  element: HTMLElement,
  strokeColor: string,
  zoom: number
) {
  element.style.border =
    model.strokeStyle !== 'none'
      ? `${model.strokeWidth * zoom}px ${model.strokeStyle === 'dash' ? 'dashed' : 'solid'} ${strokeColor}`
      : 'none';
}

function applyTransformStyles(model: ShapeElementModel, element: HTMLElement) {
  if (model.rotate && model.rotate !== 0) {
    setStyles(element, {
      transform: `rotate(${model.rotate}deg)`,
      transformOrigin: 'center',
    });
  } else {
    setStyles(element, {
      transform: '',
      transformOrigin: '',
    });
  }
}

function applyShadowStyles(
  model: ShapeElementModel,
  element: HTMLElement,
  renderer: DomRenderer
) {
  if (model.shadow) {
    const { offsetX, offsetY, blur, color } = model.shadow;
    setStyles(element, {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px ${renderer.getColorValue(color)}`,
    });
  } else {
    setStyles(element, { boxShadow: '' });
  }
}

/**
 * Renders a ShapeElementModel to a given HTMLElement using DOM properties.
 * This function is intended to be registered via the DomElementRendererExtension.
 *
 * @param model - The shape element model containing rendering properties.
 * @param element - The HTMLElement to apply the shape's styles to.
 * @param renderer - The main DOMRenderer instance, providing access to viewport and color utilities.
 */
export const shapeDomRenderer = (
  model: ShapeElementModel,
  element: HTMLElement,
  renderer: DomRenderer
): void => {
  const { zoom } = renderer.viewport;
  const fillColor = renderer.getColorValue(
    model.fillColor,
    DefaultTheme.shapeFillColor,
    true
  );
  const strokeColor = renderer.getColorValue(
    model.strokeColor,
    DefaultTheme.shapeStrokeColor,
    true
  );

  element.style.width = `${model.w * zoom}px`;
  element.style.height = `${model.h * zoom}px`;

  applyShapeSpecificStyles(model, element, zoom);

  element.style.backgroundColor = model.filled ? fillColor : 'transparent';

  applyBorderStyles(model, element, strokeColor, zoom);
  applyTransformStyles(model, element);

  element.style.boxSizing = 'border-box';
  element.style.zIndex = renderer.layerManager.getZIndex(model).toString();

  manageClassNames(model, element);
  applyShadowStyles(model, element, renderer);
};
