import { svg } from 'lit';

/** Colored Cynefin glyph for the main toolbar button. */
export const cynefinToolbarIcon = svg`<svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#3f444a" stroke-width="3" stroke-linecap="round">
    <path d="M30 8 C28 18 33 24 26 30 C20 35 14 33 9 33"/>
    <path d="M26 30 C28 40 28 46 28 50"/>
    <path d="M34 22 C40 23 46 24 50 25" stroke-dasharray="3 3"/>
  </g>
  <g stroke="#3f444a" stroke-width="1.4"><path d="M22 33 l-2 4M24 38 l-2 5M26 43 l-2 5"/></g>
</svg>`;

/** Menu icon — create the Cynefin diagram. */
export const cynefinMenuIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 3 C12 8 14 11 11 13 C8 15 5 14 3 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M11 13 C12 18 12 20 12 22" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M15 10 C18 10.5 20 11 22 11.5" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.5 2.5" stroke-linecap="round"/>
</svg>`;

/** Menu icon — create the Estuarine map. */
export const estuarineMenuIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 3 V20 M5 17 H21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M3 6 l2-2 2 2 M3 17 l2 2 2 -2 M18 15 l3 2 -3 2" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 10 C11 6 14 13 21 9" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/>
</svg>`;

/** Menu icon — hexagon constraint node. */
export const hexagonMenuIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="21,12 16.5,19.8 7.5,19.8 3,12 7.5,4.2 16.5,4.2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
</svg>`;
