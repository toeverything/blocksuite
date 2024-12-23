import {
  type AffineCssVariables,
  combinedDarkCssVariables,
  combinedLightCssVariables,
} from '@toeverything/theme';
import { unsafeCSS } from 'lit';

const toolbarColorKeys: Array<keyof AffineCssVariables> = [
  '--affine-background-overlay-panel-color',
  '--affine-v2-layer-background-overlayPanel' as never,
  '--affine-v2-layer-insideBorder-blackBorder' as never,
  '--affine-background-error-color',
  '--affine-background-primary-color',
  '--affine-background-tertiary-color',
  '--affine-icon-color',
  '--affine-icon-secondary',
  '--affine-border-color',
  '--affine-divider-color',
  '--affine-text-primary-color',
  '--affine-hover-color',
  '--affine-hover-color-filled',
];

export const lightToolbarStyles = toolbarColorKeys.map(
  key => `${key}: ${unsafeCSS(combinedLightCssVariables[key])};`
);

export const darkToolbarStyles = toolbarColorKeys.map(
  key => `${key}: ${unsafeCSS(combinedDarkCssVariables[key])};`
);
