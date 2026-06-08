import { svg } from 'lit';

/** Colored Wardley glyph (mockup proposal B) for the main toolbar button. */
export const wardleyToolbarIcon = svg`<svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wardley-evo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#fdf3e3"/>
    </linearGradient>
  </defs>
  <!-- emprise = 50×50 centrée dans la viewBox 56 (marge 3px) -->
  <svg x="3" y="3" width="48" height="48" viewBox="6 6 28 28">
    <rect x="6" y="6" width="28" height="28" rx="1" fill="url(#wardley-evo)" />
    <line x1="17" y1="12" x2="17" y2="30" stroke="#c3cad4" stroke-width="0.8" stroke-dasharray="1.6 1.6"/>
    <line x1="25" y1="12" x2="25" y2="30" stroke="#c3cad4" stroke-width="0.8" stroke-dasharray="1.6 1.6"/>
    <path d="M10 12 V30 H28" fill="none" stroke="#95948f" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 6.5 L7 12 L13 12 Z" fill="#95948f"/>
    <path d="M33.5 30 L28 27 L28 33 Z" fill="#95948f"/>
    <path d="M14 14 L20.5 19 L27 16.5 M20.5 19 L24 26" stroke="#aab4c0" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <circle cx="14" cy="14" r="2.6" fill="#1f6feb"/>
    <circle cx="20.5" cy="19" r="2.6" fill="#16a394"/>
    <circle cx="27" cy="16.5" r="2.6" fill="#e2a32b"/>
    <circle cx="24" cy="26" r="2.6" fill="#d6455d"/>
  </svg>
</svg>`;

/** Monochrome glyph for the "create background" menu item (uses currentColor). */
export const wardleyBackgroundIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 4 V19 H21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 2.6 L3.8 6 H8.2 Z" fill="currentColor"/>
  <path d="M22.4 19 L19 16.8 V21.2 Z" fill="currentColor"/>
  <line x1="11" y1="6" x2="11" y2="19" stroke="currentColor" stroke-width="0.9" stroke-dasharray="1.8 1.8" opacity="0.6"/>
  <line x1="16" y1="6" x2="16" y2="19" stroke="currentColor" stroke-width="0.9" stroke-dasharray="1.8 1.8" opacity="0.6"/>
</svg>`;

/** Wardley red — matches the renderer presets (consts WARDLEY_RED). */
const RED = '#d6455d';

/** Component node (validated COMP-C2): single circle. */
export const wardleyComponentIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="6.3" fill="#fff" stroke="currentColor" stroke-width="1.5"/>
</svg>`;

/** Anchor (validated ANCH-B): person glyph inscribed in a circle. */
export const wardleyAnchorIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="6" fill="#fff" stroke="currentColor" stroke-width="1.6"/>
  <circle cx="12" cy="9.4" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/>
  <path d="M7.4 15.9 C 8.2 12.1, 15.8 12.1, 16.6 15.9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

/** Dependency link (validated LINK-A3): two outline nodes joined by a line. */
export const wardleyLinkIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="5.5" y1="16" x2="18.5" y2="8" stroke="currentColor" stroke-width="1.8"/>
  <circle cx="5.5" cy="16" r="2.2" fill="#fff" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="18.5" cy="8" r="2.2" fill="#fff" stroke="currentColor" stroke-width="1.5"/>
</svg>`;

/** Evolution arrow (validated ARR-B): red dashed arrow. */
export const wardleyArrowIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="4.5" y1="12" x2="16" y2="12" stroke="${RED}" stroke-width="1.7" stroke-dasharray="2.4 2.2" stroke-linecap="round"/>
  <path d="M14.5 7.8 L20 12 L14.5 16.2 Z" fill="${RED}"/>
</svg>`;

/** Inertia (validated INER): black bar barring the red dashed arrow. */
export const wardleyInertiaIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="3.5" y1="12" x2="16.5" y2="12" stroke="${RED}" stroke-width="1.7" stroke-dasharray="2.4 2.2" stroke-linecap="round"/>
  <path d="M15 7.8 L20.5 12 L15 16.2 Z" fill="${RED}"/>
  <rect x="9.6" y="5.4" width="2.9" height="13.2" rx="0.6" fill="currentColor"/>
</svg>`;
