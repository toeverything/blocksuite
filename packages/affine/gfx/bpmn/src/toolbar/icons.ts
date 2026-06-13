import { svg } from 'lit';

/** Colored BPMN glyph for the main toolbar button: a pool (green name band) with
 * a single activity inside. */
export const bpmnToolbarIcon = svg`<svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="13" width="48" height="30" rx="3" fill="#ffffff" stroke="#262626" stroke-width="2.2"/>
  <path d="M6 14 h5 v28 h-5 z" fill="#43a06b"/>
  <line x1="11" y1="13" x2="11" y2="43" stroke="#262626" stroke-width="1.8"/>
  <rect x="20" y="20" width="24" height="16" rx="3.5" fill="#ffffff" stroke="#262626" stroke-width="2.2"/>
</svg>`;

/** Start event — thin green ring. */
export const bpmnStartIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8" stroke="#43a06b" stroke-width="2"/>
</svg>`;

/** End event — thick red ring. */
export const bpmnEndIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8" stroke="#cf5648" stroke-width="3.5"/>
</svg>`;

/** Task — rounded rectangle. */
export const bpmnTaskIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" stroke="currentColor" stroke-width="1.6"/>
</svg>`;

/** Exclusive gateway — diamond with an X. */
export const bpmnGatewayIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3 L21 12 L12 21 L3 12 Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M9 9 L15 15 M15 9 L9 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

/** Sequence flow — solid arrow with a filled head. */
export const bpmnSequenceIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 12 H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M15 8 L21 12 L15 16 Z" fill="currentColor"/>
</svg>`;

/** Pool — rectangle with a left name band. */
export const bpmnPoolIcon = svg`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
  <path d="M8 5.5 V18.5" stroke="currentColor" stroke-width="1.6"/>
</svg>`;
