import { html } from 'lit';
// prettier-ignore
// TODO: Need to correct this SVG to match the design
export const SheetTooltip = html`<svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="200" height="100" rx="4" fill="white" stroke="#E0E0E0"/>
<text fill="#121212" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="12" letter-spacing="0px">
<tspan x="10" y="20">Tip: You can merge cells by selecting them</tspan>
<tspan x="10" y="40">and using the "Merge Cells" option in the</tspan>
<tspan x="10" y="60">toolbar. This is useful for creating headers</tspan>
<tspan x="10" y="80">or grouping related data.</tspan>
</text>
</svg>
`;
