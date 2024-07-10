import { css } from 'lit';

import { FONT_SM, FONT_XS } from '../../../../_common/styles.js';

export const COLOR_PICKER_STYLE = css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: normal;
    gap: 12px;
    min-width: 198px;
    padding: 16px;
  }

  nav {
    display: flex;
    padding: 2px;
    align-items: flex-start;
    gap: 4px;
    align-self: stretch;
    border-radius: 8px;
    background: var(--affine-hover-color);
  }

  nav button {
    display: flex;
    padding: 4px 8px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1 0 0;

    ${FONT_XS}
    color: var(--affine-text-secondary-color);
    font-weight: 600;

    border-radius: 8px;
    background: transparent;
    border: none;
  }

  nav button[actived] {
    color: var(--affine-text-primary-color, #121212);
    background: var(--affine-white);
    box-shadow: var(--affine-shadow-1);
    pointer-events: none;
  }

  .modes {
    display: none;
    gap: 8px;
    align-self: stretch;
  }
  .modes[actived] {
    display: flex;
  }

  .modes .mode {
    display: flex;
    padding: 2px;
    flex-direction: column;
    flex: 1 0 0;
  }

  .modes .mode button {
    position: relative;
    display: flex;
    height: 60px;
    padding: 12px 12px 8px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    align-self: stretch;
    border-radius: 8px;
    border: 1px solid var(--affine-border-color);
    box-sizing: border-box;

    ${FONT_XS}
    font-weight: 400;
    color: var(--affine-text-secondary-color);
  }
  .modes .mode.light button {
    background: white;
  }
  .modes .mode.dark button {
    background: #141414;
  }
  .modes .mode button .color {
    background: var(--c);
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    overflow: hidden;
  }
  .modes .mode button[actived] {
    pointer-events: none;
    outline: 2px solid var(--affine-brand-color);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: inherit;
  }

  .color-area-wrapper {
    position: relative;
    width: 100%;
    height: 170px;
  }

  .color-area-wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    opacity: var(--o, 1);
    background-image: linear-gradient(to bottom, transparent, #000),
      linear-gradient(to right, #fff, var(--bg));
    border-radius: 4px;
    overflow: hidden;
  }
  .color-area-wrapper::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    border-radius: 4px;
    overflow: hidden;
    pointer-events: none;
  }

  .color-circle {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--size);
    height: var(--size);
    left: calc(-1 * var(--size) / 2);
    transform: translate(var(--x, 0), var(--y, 0));
    background: transparent;
    border: 0.5px solid #e3e2e4;
    border-radius: 50%;
    box-sizing: border-box;
    box-shadow: 0px 0px 0px 0.5px #e3e3e4 inset;
    filter: drop-shadow(0px 0px 12px rgba(66, 65, 73, 0.14));
    pointer-events: none;
    z-index: 2;
  }
  .color-circle::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--c);
    box-sizing: border-box;
  }
  .color-circle::after {
    content: '';
    position: absolute;
    width: calc(var(--size) - 1px);
    height: calc(var(--size) - 1px);
    background: transparent;
    border-style: solid;
    border-color: white;
    border-radius: 50%;
    box-sizing: border-box;
  }

  .color-area-wrapper {
    --size: calc(var(--r, 12.5px) * 2);
  }
  .color-area-wrapper .color-circle {
    top: calc(-1 * var(--size) / 2);
  }
  .color-area-wrapper .color-circle::before {
    opacity: var(--o, 1);
  }
  .color-area-wrapper .color-circle::after {
    border-width: 4px;
  }
  .color-area,
  .color-slider {
    position: absolute;
    inset: calc(-1 * var(--size) / 2);
  }

  .color-slider-wrapper {
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
    height: 12px;
    margin-top: 4px;
    margin-bottom: 12px;
  }
  .color-slider-wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    background-image: var(--colors);
    border-radius: 12px;
    overflow: hidden;
  }

  .color-slider-wrapper {
    --size: calc(var(--r, 10.5px) * 2);
  }
  .color-slider-wrapper .color-circle::after {
    border-width: 2px;
  }

  footer {
    display: flex;
    justify-content: space-between;
  }

  .field {
    display: flex;
    padding: 7px 9px;
    align-items: center;
    gap: 4px;
    border-radius: 8px;
    border: 1px solid var(--affine-border-color);
    background: var(--affine-white-30);
    box-sizing: border-box;
  }

  .field.color {
    width: 134px;
  }

  .field.opacity {
    width: 56px;
    gap: 0;
  }

  input {
    display: flex;
    width: 100%;
    padding: 0;
    background: transparent;
    border: none;
    outline: none;
    ${FONT_SM}
  }

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
  }
`;
