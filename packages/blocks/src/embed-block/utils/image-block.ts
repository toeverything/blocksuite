// import { LitElement, html, css, unsafeCSS } from 'lit';
// import { customElement, property } from 'lit/decorators.js';

import { html } from 'lit';

export function makeResizableDiv(
  element: HTMLElement,
  originalWidth: number,
  cb: void
) {
  return new ResizableDiv(element, originalWidth, cb);
}



export const getImageBlock = (props: any) => {
  const { source } = props;
  return html`
    <div class="image-wrapper">
      <div class="resizable">
        <div class="image-option-container">
          <ul class="image-option">
            <li>1</li>
            <li>2</li>
            <li>3</li>
            <li>4</li>
          </ul>
        </div>

        <div class="resizes">
          <div class="resize top-left"></div>
          <div class="resize top-right"></div>
          <div class="resize bottom-left"></div>
          <div class="resize bottom-right"></div>
          <!-- <div > -->
          <img src=${source} />
          <!-- </div> -->
        </div>
      </div>
    </div>
  `;
};
class ResizableDiv {
  public width: number = 0;
  private originalWidth: number;
  private originalMouseX = 0;
  private minimumSize = 20;
  private maximumSize: number;
  private container: HTMLElement;
  private onresize: ((width: number) => void) | null = null;
  private topLeftHandle: HTMLElement | null = null;
  private topRightHandle: HTMLElement | null = null;
  private bottomLeftHandle: HTMLElement | null = null;
  private bottomRightHandle: HTMLElement | null = null;

  constructor(element: HTMLElement, originalWidth: number, cb: void) {
    this.container = element;
    this.width = 0;
    this.maximumSize = originalWidth > 720 ? 720 : originalWidth;
    this.originalWidth = this.maximumSize;
    this.handLeft = this.handLeft.bind(this);
    this.handRight = this.handRight.bind(this);
    this.resizeLeft = this.resizeLeft.bind(this);
    this.resizeRight = this.resizeRight.bind(this);
    this.stopResize = this.stopResize.bind(this);
    this.initMouseEventHandlers();
  }

  private initMouseEventHandlers() {
    this.topLeftHandle = this.container.querySelector('.top-left');
    this.topRightHandle = this.container.querySelector('.top-right');
    this.bottomLeftHandle = this.container.querySelector('.bottom-left');
    this.bottomRightHandle = this.container.querySelector('.bottom-right');
    if (this.topLeftHandle) {
      this.topLeftHandle.addEventListener('mousedown', this.handLeft);
    }
    if (this.topRightHandle) {
      this.topRightHandle.addEventListener('mousedown', this.handRight);
    }
    if (this.bottomLeftHandle) {
      this.bottomLeftHandle.addEventListener('mousedown', this.handLeft);
    }
    if (this.bottomRightHandle) {
      this.bottomRightHandle.addEventListener('mousedown', this.handRight);
    }
  }

  public onResize(cb: (width: number) => void) {
    this.onresize = cb;
  }

  private handLeft(e: MouseEvent) {
    e.stopPropagation();
    this.originalMouseX = e.pageX;
    window.addEventListener('mousemove', this.resizeLeft);
    window.addEventListener('mouseup', this.stopResize);
  }

  private handRight(e: MouseEvent) {
    this.originalMouseX = e.pageX;
    e.stopPropagation();
    window.addEventListener('mousemove', this.resizeRight);
    window.addEventListener('mouseup', this.stopResize);
  }

  public dispose() {
    if (this.topLeftHandle) {
      this.topLeftHandle.removeEventListener('mousedown', this.handLeft);
    }
    if (this.topRightHandle) {
      this.topRightHandle.removeEventListener('mousedown', this.handRight);
    }
    if (this.bottomLeftHandle) {
      this.bottomLeftHandle.removeEventListener('mousedown', this.handLeft);
    }
    if (this.bottomRightHandle) {
      this.bottomRightHandle.removeEventListener('mousedown', this.handRight);
    }
  }

  private resizeLeft(e: MouseEvent) {
    const width = this.originalWidth - (e.pageX - this.originalMouseX);
    if (width > this.minimumSize && width < this.maximumSize) {
      this.width = width;
      // @ts-ignore
      this.container.style.width = `${this.width}px`;
    }
  }
  private resizeRight(e: MouseEvent) {
    const width = this.originalWidth + (e.pageX - this.originalMouseX);
    if (width > this.minimumSize && width < this.maximumSize) {
      this.width = width;
      // @ts-ignore
      this.container.style.width = `${this.width}px`;
    }
  }

  private stopResize() {
    if (this.onresize) {
      this.onresize(this.width);
    }
    window.removeEventListener('mousemove', this.resizeLeft);
    window.removeEventListener('mousemove', this.resizeRight);
  }
}
