// import { LitElement, html, css, unsafeCSS } from 'lit';
// import { customElement, property } from 'lit/decorators.js';

import { html } from 'lit';
import { assertExists } from '../../__internal__';

export function makeResizableDiv(element: HTMLElement) {
  // const element = document.querySelector(className) as Element;
  const resizes = element.querySelectorAll( '.resize');
  const minimumSize = 20;
  assertExists(element)
  const maximumSize = (element.closest('.affine-embed-block-container')?.clientWidth??600) - 30;
  let originalWidth = 0;
  let originalMouseX = 0;
  for (let i = 0; i < resizes.length; i++) {
    const currentResider = resizes[i];
    currentResider.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      originalWidth = parseFloat(
        getComputedStyle(element, null)
          .getPropertyValue('width')
          .replace('px', '')
      );
      // @ts-ignore
      originalMouseX = e.pageX;
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    });
    // @ts-ignore
    function resize(e) {
      e.preventDefault();
      e.stopPropagation();
      if (currentResider.classList.contains('bottom-right')) {
        const width = originalWidth + (e.pageX - originalMouseX);
        if (width > minimumSize && width < maximumSize) {
          // @ts-ignore
          element.style.width = width + 'px';
        }
      } else if (currentResider.classList.contains('bottom-left')) {
        const width = originalWidth - (e.pageX - originalMouseX);
        if (width > minimumSize && width < maximumSize) {
          // @ts-ignore
          element.style.width = width + 'px';
        }
      } else if (currentResider.classList.contains('top-right')) {
        const width = originalWidth + (e.pageX - originalMouseX);
        if (width > minimumSize && width < maximumSize) {
          // @ts-ignore
          element.style.width = width + 'px';
        }
      } else {
        const width = originalWidth - (e.pageX - originalMouseX);
        if (width > minimumSize && width < maximumSize) {
          // @ts-ignore
          element.style.width = width + 'px';
        }
      }
    }
    function stopResize() {
      window.removeEventListener('mousemove', resize);
    }
  }
}

export const getImageBlock = (props: any) => {
  const { source } = props;
  return html`
    <div  class="resizable">
      <div class="resizes">
        <div class="resize top-left" ></div>
        <div class="resize top-right"></div>
        <div class="resize bottom-left"></div>
        <div class="resize bottom-right"></div>
        <!-- <div > -->
          <img src=${source} />
        <!-- </div> -->
      </div>
    </div>
  `;
};
