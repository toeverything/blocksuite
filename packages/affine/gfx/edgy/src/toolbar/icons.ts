import { svg } from 'lit';

/** Colored EDGY facets glyph for the main toolbar button (3 overlapping circles). */
export const edgyToolbarIcon = svg`<svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g opacity="0.95">
    <circle cx="22" cy="24" r="13" fill="#00ea4e"/>
    <circle cx="34" cy="24" r="13" fill="#034cee"/>
    <circle cx="28" cy="34" r="13" fill="#ff0056"/>
  </g>
</svg>`;

/** Menu icon — the facets diagram (colored mini Venn). */
export const edgyFacetsIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="9.5" cy="10" r="6" fill="#00ea4e" opacity="0.92"/>
  <circle cx="14.5" cy="10" r="6" fill="#034cee" opacity="0.92"/>
  <circle cx="12" cy="14.5" r="6" fill="#ff0056" opacity="0.92"/>
</svg>`;

/** People — person glyph (official Icon-People), uses currentColor. */
export const edgyPeopleIcon = svg`<svg width="24" height="24" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="m16,19c-3.308,0-6-2.692-6-6v-4c0-3.308,2.692-6,6-6s6,2.692,6,6v4c0,3.308-2.692,6-6,6Zm0-14c-2.206,0-4,1.794-4,4v4c0,2.206,1.794,4,4,4s4-1.794,4-4v-4c0-2.206-1.794-4-4-4Z"/>
  <path d="m29,30H3v-3.5c0-3.308,2.692-6,6-6h14c3.308,0,6,2.692,6,6v3.5Zm-24-2h22v-1.5c0-2.206-1.794-4-4-4h-14c-2.206,0-4,1.794-4,4v1.5Z"/>
</svg>`;

/** Outcome — lightly rounded rectangle. */
export const edgyOutcomeIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="6.5" width="17" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/>
</svg>`;

/** Object — plain rectangle. */
export const edgyObjectIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="6.5" width="17" height="11" stroke="currentColor" stroke-width="1.6"/>
</svg>`;

/** Activity — right-pointing chevron. */
export const edgyActivityIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3.5 6.5 H15 L20.5 12 L15 17.5 H3.5 Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
</svg>`;
