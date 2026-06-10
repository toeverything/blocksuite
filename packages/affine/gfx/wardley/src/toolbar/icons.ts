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

/** Pipeline (validated PIPE-D): wide thin rect + square handle astride the top edge, thin borders. */
export const wardleyPipelineIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="11" width="17" height="7" rx="1" fill="#fff" stroke="currentColor" stroke-width="1.2"/>
  <rect x="10" y="9" width="4" height="4" rx="0.6" fill="#fff" stroke="currentColor" stroke-width="1.2"/>
</svg>`;

/** Market (validated MKT-B): thin outer circle + 3 thick-bordered nodes wired in a triangle. */
export const wardleyMarketIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9.6" fill="#fff" stroke="currentColor" stroke-width="1.2"/>
  <path d="M12 6.6 L7.3 14.7 H16.7 Z" fill="none" stroke="currentColor" stroke-width="1.1"/>
  <circle cx="12" cy="6.6" r="2.3" fill="#fff" stroke="currentColor" stroke-width="2.1"/>
  <circle cx="7.3" cy="14.7" r="2.3" fill="#fff" stroke="currentColor" stroke-width="2.1"/>
  <circle cx="16.7" cy="14.7" r="2.3" fill="#fff" stroke="currentColor" stroke-width="2.1"/>
</svg>`;

/** Ecosystem (validated ECO-A): double border at the rim + hatching confined to the inner donut + hollow center. */
export const wardleyEcosystemIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs><clipPath id="ecoHatch"><path d="M12 3.8 a8.2 8.2 0 1 0 0.001 0 Z M12 7.8 a4.2 4.2 0 1 1 -0.001 0 Z" clip-rule="evenodd"/></clipPath></defs>
  <circle cx="12" cy="12" r="9.8" fill="#fff" stroke="currentColor" stroke-width="1.2"/>
  <g clip-path="url(#ecoHatch)" stroke="currentColor" stroke-width="0.6">
    <line x1="2" y1="-8" x2="22" y2="12"/>
    <line x1="2" y1="-6" x2="22" y2="14"/>
    <line x1="2" y1="-4" x2="22" y2="16"/>
    <line x1="2" y1="-2" x2="22" y2="18"/>
    <line x1="2" y1="0" x2="22" y2="20"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
    <line x1="2" y1="4" x2="22" y2="24"/>
    <line x1="2" y1="6" x2="22" y2="26"/>
    <line x1="2" y1="8" x2="22" y2="28"/>
    <line x1="2" y1="10" x2="22" y2="30"/>
  </g>
  <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="0.8"/>
  <circle cx="12" cy="12" r="4.2" fill="#fff" stroke="currentColor" stroke-width="1"/>
</svg>`;

/** Component + method (validated METH-A): component inscribed in a colored outer circle (default grey). */
export const wardleyMethodIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9.6" fill="#d9d9d9" stroke="#1f2328" stroke-width="1.2"/>
  <circle cx="12" cy="12" r="4.6" fill="#fff" stroke="#1f2328" stroke-width="1.2"/>
</svg>`;

/** Legend: a bordered box with glyph + line rows. */
export const wardleyLegendIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/>
  <circle cx="6.6" cy="8" r="1.4" fill="currentColor"/>
  <line x1="9.6" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="6.6" cy="12" r="1.4" fill="currentColor"/>
  <line x1="9.6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <circle cx="6.6" cy="16" r="1.4" fill="currentColor"/>
  <line x1="9.6" y1="16" x2="15" y2="16" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

/** Opportunity gradient background: axes + green differential hump + red operational bump. */
export const wardleyOpportunityIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 20V4M4 20h16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M5 12 C6 7, 8.5 7, 9.5 11 C11 17, 14 19, 18 20" stroke="#1f9e4d" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  <path d="M14.5 19.5 C15.5 16.5, 17 16.5, 18 19" stroke="#d6455d" stroke-width="1.7" fill="none" stroke-linecap="round"/>
</svg>`;

/** Benefit/Investment gradient background: axes + zero line + green J-curve. */
export const wardleyBenefitIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 20V4M4 20h16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="4" y1="14" x2="20" y2="14" stroke="currentColor" stroke-width="0.9" opacity="0.45"/>
  <path d="M5 17 C6 18.5, 7 18.5, 8 15 C9.5 9, 12 5.5, 13.5 8 C16 12, 18 14, 20 14.5" stroke="#1f9e4d" stroke-width="1.7" fill="none" stroke-linecap="round"/>
</svg>`;

/** Evolution-gradient background (Wardley's S-curve presentation): grey at both edges fading to white center. */
export const wardleyEvolutionGradientIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wardleyGreyU" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9aa0a6"/>
      <stop offset="0.35" stop-color="#ffffff"/>
      <stop offset="0.65" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#9aa0a6"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4.5" width="16" height="15" rx="2" fill="url(#wardleyGreyU)" stroke="currentColor" stroke-width="1.2"/>
</svg>`;
