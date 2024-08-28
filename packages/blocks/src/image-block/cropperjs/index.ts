import { noop } from '@blocksuite/global/utils';

import CropperCanvas from './canvas.js';
import {
  CROPPER_CANVAS,
  CROPPER_IMAGE,
  CROPPER_SELECTION,
} from './constants.js';
import { isElement, isString } from './functions.js';
import CropperHandle from './handle.js';
import CropperImage from './image.js';
import CropperSelection from './selection.js';
import CropperShade from './shade.js';

const REGEXP_ALLOWED_ELEMENTS = /^img|canvas$/;

noop(CropperCanvas);
noop(CropperHandle);
noop(CropperImage);
noop(CropperSelection);
noop(CropperShade);

class Cropper {
  static version = '__VERSION__';

  container: Element;

  element: HTMLImageElement | HTMLCanvasElement;

  constructor(
    element: HTMLImageElement | HTMLCanvasElement | string,
    blockId: string
  ) {
    if (isString(element)) {
      element = document.querySelector(element) as HTMLImageElement;
    }

    if (
      !isElement(element) ||
      !REGEXP_ALLOWED_ELEMENTS.test(element.localName)
    ) {
      throw new Error(
        'The first argument is required and must be an <img> or <canvas> element.'
      );
    }

    this.element = element;

    const tagName = element.localName;
    let src = '';

    if (tagName === 'img') {
      ({ src } = element as HTMLImageElement);
    } else if (tagName === 'canvas' && window.HTMLCanvasElement) {
      src = (element as HTMLCanvasElement).toDataURL();
    }

    const ownerDocument = element.ownerDocument;

    if (element.parentElement) {
      this.container = element.parentElement;
    } else {
      this.container = ownerDocument.body;
    }

    const templateElement = document.createElement('template');
    const documentFragment = document.createDocumentFragment();

    templateElement.innerHTML =
      `<cropper-canvas background block-id="${blockId}">` +
      '<cropper-image></cropper-image>' +
      '<cropper-shade hidden></cropper-shade>' +
      '<cropper-handle action="select" plain></cropper-handle>' +
      '<cropper-selection initial-coverage="0.5" movable resizable>' +
      '<cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>' +
      '<cropper-handle action="n-resize"></cropper-handle>' +
      '<cropper-handle action="e-resize"></cropper-handle>' +
      '<cropper-handle action="s-resize"></cropper-handle>' +
      '<cropper-handle action="w-resize"></cropper-handle>' +
      '<cropper-handle action="ne-resize"></cropper-handle>' +
      '<cropper-handle action="nw-resize"></cropper-handle>' +
      '<cropper-handle action="se-resize"></cropper-handle>' +
      '<cropper-handle action="sw-resize"></cropper-handle>' +
      '</cropper-selection>' +
      '</cropper-canvas>';
    documentFragment.append(templateElement.content);

    Array.from(documentFragment.querySelectorAll(CROPPER_IMAGE)).forEach(
      image => {
        image.setAttribute('src', src);
        image.setAttribute(
          'alt',
          (element as HTMLImageElement).alt || 'The image to crop'
        );
      }
    );

    if (element.parentElement) {
      element.style.display = 'none';
      this.container.insertBefore(documentFragment, element.nextSibling);
    } else {
      this.container.append(documentFragment);
    }
  }

  getCropperCanvas(): CropperCanvas | null {
    return this.container.querySelector(CROPPER_CANVAS);
  }

  getCropperImage(): CropperImage | null {
    return this.container.querySelector(CROPPER_IMAGE);
  }

  getCropperSelection(): CropperSelection | null {
    return this.container.querySelector(CROPPER_SELECTION);
  }

  getCropperSelections(): NodeListOf<CropperSelection> | null {
    return this.container.querySelectorAll(CROPPER_SELECTION);
  }
}

export {
  Cropper,
  CropperCanvas,
  CropperHandle,
  CropperImage,
  CropperSelection,
  CropperShade,
};
