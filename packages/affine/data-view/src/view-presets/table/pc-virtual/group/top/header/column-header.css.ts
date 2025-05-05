import { baseTheme } from '@toeverything/theme';
import { cssVarV2 } from '@toeverything/theme/v2';
import { globalStyle, style } from '@vanilla-extract/css';

import {
  DEFAULT_ADD_BUTTON_WIDTH,
  DEFAULT_COLUMN_TITLE_HEIGHT,
} from '../../../../consts';

export const columnHeaderContainer = style({
  display: 'block',
  backgroundColor: 'var(--affine-background-primary-color)',
  position: 'relative',
  zIndex: 2,
});

export const columnHeader = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  borderBottom: `1px solid ${cssVarV2.layer.insideBorder.border}`,
  borderTop: `1px solid ${cssVarV2.layer.insideBorder.border}`,
  boxSizing: 'border-box',
  userSelect: 'none',
  backgroundColor: 'var(--affine-background-primary-color)',
});

export const column = style({
  cursor: 'pointer',
});

export const cell = style({
  userSelect: 'none',
});

export const addColumnButton = style({
  flex: 1,
  minWidth: `${DEFAULT_ADD_BUTTON_WIDTH}px`,
  minHeight: '100%',
  display: 'flex',
  alignItems: 'center',
});

export const columnContent = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
  height: '100%',
  padding: '6px',
  boxSizing: 'border-box',
  position: 'relative',
});

export const columnText = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  overflow: 'hidden',
  color: 'var(--affine-text-secondary-color)',
  fontSize: '14px',
  position: 'relative',
});

export const columnTypeIcon = style({
  display: 'flex',
  alignItems: 'center',
  borderRadius: '4px',
  padding: '2px',
  fontSize: '18px',
  color: cssVarV2.icon.primary,
});

export const columnTextContent = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
});

export const columnTextInput = style({
  flex: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontWeight: 500,
});

export const columnTextIcon = style({
  display: 'flex',
  alignItems: 'center',
  width: '16px',
  height: '16px',
  background: 'var(--affine-white)',
  border: `1px solid ${cssVarV2.layer.insideBorder.border}`,
  borderRadius: '4px',
  opacity: 0,
});

export const columnTextSaveIcon = style({
  display: 'flex',
  alignItems: 'center',
  width: '16px',
  height: '16px',
  border: '1px solid transparent',
  borderRadius: '4px',
  fill: 'var(--affine-icon-color)',
  selectors: {
    '&:hover': {
      background: 'var(--affine-white)',
      borderColor: cssVarV2.layer.insideBorder.border,
    },
  },
});

export const columnInput = style({
  width: '100%',
  height: '24px',
  padding: 0,
  border: 'none',
  color: 'inherit',
  fontWeight: 600,
  fontSize: '14px',
  fontFamily: baseTheme.fontSansFamily,
  background: 'transparent',
  selectors: {
    '&:focus': {
      outline: 'none',
    },
  },
});

export const columnMove = style({
  display: 'flex',
  alignItems: 'center',
  vars: {
    '--color': 'var(--affine-placeholder-color)',
    '--active': 'var(--affine-black-10)',
    '--bw': '1px',
    '--bw2': '-1px',
  },
  cursor: 'grab',
  background: 'none',
  border: 'none',
  borderRadius: 0,
  position: 'absolute',
  inset: 0,
});

globalStyle(`${columnMove} svg`, {
  width: '10px',
  height: '14px',
  color: 'var(--affine-black-10)',
  cursor: 'grab',
  opacity: 0,
});

export const databaseAddColumnButton = style({
  position: 'sticky',
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '38px',
  cursor: 'pointer',
});

export const headerAddColumnButton = style({
  height: `${DEFAULT_COLUMN_TITLE_HEIGHT}px`,
  backgroundColor: 'var(--affine-background-primary-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  cursor: 'pointer',
  fontSize: '18px',
  color: cssVarV2.icon.primary,
});

export const columnTypeMenuIcon = style({
  border: `1px solid ${cssVarV2.layer.insideBorder.border}`,
  borderRadius: '4px',
  padding: '5px',
  backgroundColor: 'var(--affine-background-secondary-color)',
});

export const columnMovePreview = style({
  position: 'fixed',
  zIndex: 100,
  width: '100px',
  height: '100px',
  background: 'var(--affine-text-emphasis-color)',
});
