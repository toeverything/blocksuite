/* eslint-disable @typescript-eslint/no-restricted-imports */
import '@shoelace-style/shoelace/dist/components/card/card.js';

import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type Shepherd from 'shepherd.js';

import * as examples from '../data/index.js';
import { createExampleListTour } from '../tutorial';

const initFunctions = Object.values(examples);

@customElement('example-list')
export class ExampleList extends LitElement {
  static styles = css`
    .container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      margin: 1rem;
      gap: 1rem;
    }

    .card {
      width: 300px;
      font-family: var(--sl-input-font-family);
      font-size: 14px;
      cursor: pointer;
    }

    /* Ref: https://github.com/shipshapecode/shepherd/issues/890 */
    .shepherd-element {
      background: #fff;
      border-radius: 5px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      opacity: 0;
      outline: none;
      transition: opacity 0.3s, visibility 0.3s;
      visibility: hidden;
      width: 100%;
      z-index: 9999;
    }
    .shepherd-enabled.shepherd-element {
      opacity: 1;
      visibility: visible;
    }
    .shepherd-element[data-popper-reference-hidden]:not(.shepherd-centered) {
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    .shepherd-element,
    .shepherd-element *,
    .shepherd-element :after,
    .shepherd-element :before {
      box-sizing: border-box;
    }
    .shepherd-arrow,
    .shepherd-arrow:before {
      position: absolute;
      width: 16px;
      height: 16px;
      z-index: -1;
    }
    .shepherd-arrow:before {
      content: '';
      transform: rotate(45deg);
      background: #fff;
    }
    .shepherd-element[data-popper-placement^='top'] > .shepherd-arrow {
      bottom: -8px;
    }
    .shepherd-element[data-popper-placement^='bottom'] > .shepherd-arrow {
      top: -8px;
    }
    .shepherd-element[data-popper-placement^='left'] > .shepherd-arrow {
      right: -8px;
    }
    .shepherd-element[data-popper-placement^='right'] > .shepherd-arrow {
      left: -8px;
    }
    .shepherd-element.shepherd-centered > .shepherd-arrow {
      opacity: 0;
    }
    .shepherd-element.shepherd-has-title[data-popper-placement^='bottom']
      > .shepherd-arrow:before {
      background-color: #e6e6e6;
    }
    .shepherd-target-click-disabled.shepherd-enabled.shepherd-target,
    .shepherd-target-click-disabled.shepherd-enabled.shepherd-target * {
      pointer-events: none;
    }
    .shepherd-modal-overlay-container {
      -ms-filter: progid:dximagetransform.microsoft.gradient.alpha(Opacity=50);
      filter: alpha(opacity=50);
      height: 0;
      left: 0;
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
      position: fixed;
      top: 0;
      transition: all 0.3s ease-out, height 0ms 0.3s, opacity 0.3s 0ms;
      width: 100vw;
      z-index: 9997;
    }
    .shepherd-modal-overlay-container.shepherd-modal-is-visible {
      height: 100vh;
      opacity: 0.5;
      transition: all 0.3s ease-out, height 0s 0s, opacity 0.3s 0s;
    }
    .shepherd-modal-overlay-container.shepherd-modal-is-visible path {
      pointer-events: all;
    }
    .shepherd-content {
      border-radius: 5px;
      outline: none;
      padding: 0;
    }
    .shepherd-footer {
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      display: flex;
      justify-content: flex-end;
      padding: 0 0.75rem 0.75rem;
    }
    .shepherd-footer .shepherd-button:last-child {
      margin-right: 0;
    }
    .shepherd-header {
      align-items: center;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      display: flex;
      justify-content: flex-end;
      line-height: 2em;
      padding: 0.75rem 0.75rem 0;
    }
    .shepherd-has-title .shepherd-content .shepherd-header {
      background: #e6e6e6;
      padding: 1em;
    }
    .shepherd-text {
      color: rgba(0, 0, 0, 0.75);
      font-size: 1rem;
      line-height: 1.3em;
      max-height: 30vh;
      overflow: scroll;
      padding: 0.75em;
    }
    .shepherd-text p {
      margin-top: 0;
    }
    .shepherd-text p:last-child {
      margin-bottom: 0;
    }
    .shepherd-button {
      background: #3288e6;
      border: 0;
      border-radius: 3px;
      color: hsla(0, 0%, 100%, 0.75);
      cursor: pointer;
      margin-right: 0.5rem;
      padding: 0.5rem 1.5rem;
      transition: all 0.5s ease;
    }
    .shepherd-button:not(:disabled):hover {
      background: #196fcc;
      color: hsla(0, 0%, 100%, 0.75);
    }
    .shepherd-button.shepherd-button-secondary {
      background: #f1f2f3;
      color: rgba(0, 0, 0, 0.75);
    }
    .shepherd-button.shepherd-button-secondary:not(:disabled):hover {
      background: #d6d9db;
      color: rgba(0, 0, 0, 0.75);
    }
    .shepherd-button:disabled {
      cursor: not-allowed;
    }
    .shepherd-cancel-icon {
      background: transparent;
      border: none;
      color: hsla(0, 0%, 50.2%, 0.75);
      font-size: 2em;
      cursor: pointer;
      font-weight: 400;
      margin: 0;
      padding: 0;
      transition: color 0.5s ease;
    }
    .shepherd-cancel-icon:hover {
      color: rgba(0, 0, 0, 0.75);
    }
    .shepherd-has-title .shepherd-content .shepherd-cancel-icon {
      color: hsla(0, 0%, 50.2%, 0.75);
    }
    .shepherd-has-title .shepherd-content .shepherd-cancel-icon:hover {
      color: rgba(0, 0, 0, 0.75);
    }
    .shepherd-title {
      color: rgba(0, 0, 0, 0.75);
      display: flex;
      font-size: 1rem;
      font-weight: 400;
      flex: 1 0 auto;
      margin: 0;
      padding: 0;
    }
  `;

  private _tour: Shepherd.Tour | null = null;

  protected firstUpdated() {
    if (sessionStorage.getItem('first-time') === null) {
      this._tour = createExampleListTour(this);
      this._tour.start();
      sessionStorage.setItem('first-time', 'true');
    }
  }

  disconnectedCallback() {
    this._tour?.hide();
    super.disconnectedCallback();
  }

  render() {
    return html`
      <div class="container">
        ${repeat(
          initFunctions,
          fn => html`
            <sl-card
              class="card"
              data-example-name=${fn.displayName}
              @click=${() => fn(window.workspace)}
            >
              <div slot="header">${fn.displayName}</div>
              ${fn.description}
            </sl-card>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'example-list': ExampleList;
  }
}
