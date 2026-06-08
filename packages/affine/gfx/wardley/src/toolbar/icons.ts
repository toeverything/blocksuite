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
