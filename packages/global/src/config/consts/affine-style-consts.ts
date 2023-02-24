export const plate = {
  primary: '#6880ff',
  pageBackground: '#fff',
  popoverBackground: '#fff',
  hoverBackground: '#f1f3ff',
  cardHoverBackground: '#f1f3ff',
  codeBackground: '#f2f5f9',
  codeBlockBackground: '#fafbfd',
  blockHubBackground: '#fbfbfc',
  textColor: '#3a4c5c',
  edgelessTextColor: '#3a4c5c',
  linkColor: '#6880ff',
  linkVisitedColor: '#abb8fe',
  IconColor: '#888a94',
  PopoverColor: '#4c6275',
  codeColor: '#48749b',
  quoteColor: '#4c6275',
  selectedColor: 'rgba(104, 128, 255, 0.1)',
  placeHolderColor: '#c7c7c7',
  borderColor: '#d0d7e3',
  disableColor: '#c0c0c0',
  lineNumberColor: '#888a9e',
  tooltipColor: '#fff',
  tooltipBackground: '#6880ff',
};
export const CSSColorProperties: Array<{
  name: string;
  cssProperty: string;
}> = [
  { name: 'primary', cssProperty: '--affine-primary-color' },
  { name: 'pageBackground', cssProperty: '--affine-page-background' },
  { name: 'popoverBackground', cssProperty: '--affine-popover-background' },
  { name: 'hoverBackground', cssProperty: '--affine-hover-background' },
  { name: 'codeBackground', cssProperty: '--affine-code-background' },
  {
    name: 'codeBlockBackground',
    cssProperty: '--affine-code-block-background',
  },
  {
    name: 'blockHubBackground',
    cssProperty: ' --affine-hub-background',
  },
  {
    name: 'cardHoverBackground',
    cssProperty: '--affine-card-hover-background',
  },
  { name: 'textColor', cssProperty: '--affine-text-color' },
  {
    name: 'edgelessTextColor',
    cssProperty: '--affine-edgeless-text-color',
  },
  { name: 'linkColor', cssProperty: '--affine-link-color' },
  { name: 'linkVisitedColor', cssProperty: '--affine-link-visited-color' },
  { name: 'IconColor', cssProperty: '--affine-icon-color' },
  { name: 'PopoverColor', cssProperty: '--affine-popover-color' },
  { name: 'codeColor', cssProperty: '--affine-code-color' },
  { name: 'quoteColor', cssProperty: '--affine-quote-color' },
  { name: 'selectedColor', cssProperty: '--affine-selected-color' },
  { name: 'placeHolderColor', cssProperty: '--affine-placeholder-color' },
  { name: 'borderColor', cssProperty: '--affine-border-color' },
  { name: 'disableColor', cssProperty: '--affine-disable-color' },
  { name: 'lineNumberColor', cssProperty: '--affine-line-number-color' },
  { name: 'tooltipColor', cssProperty: '--affine-tooltip-color' },
  { name: 'tooltipBackground', cssProperty: '--affine-tooltip-background' },
];
export const CSSSizeProperties: Array<{
  name: string;
  defaultValue: number;
  cssProperty: string;
}> = [
  {
    name: 'lineHeight',
    defaultValue: 26,
    cssProperty: '--affine-line-height-base',
  },
  { name: 'font-xs', defaultValue: 12, cssProperty: '--affine-font-xs' },
  { name: 'font-sm', defaultValue: 16, cssProperty: '--affine-font-sm' },
  {
    name: 'font-base',
    defaultValue: 18,
    cssProperty: '--affine-font-base',
  },
];
