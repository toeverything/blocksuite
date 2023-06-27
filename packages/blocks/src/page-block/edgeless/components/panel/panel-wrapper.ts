import { css, html, type TemplateResult } from 'lit';

export const panelWrapperStyle = [
  css`
    .edgeless-component-panel-wrapper {
      display: flex;
      padding: 4px;
      justify-content: center;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }
  `,
];

interface PanelWrapperProps {
  className?: string;
  children: TemplateResult<1>;
}

export function PanelWrapper({ children, className }: PanelWrapperProps) {
  const name = `edgeless-component-panel-wrapper ${className ? className : ''}`;
  return html`<div class=${name}>${children}</div>`;
}
