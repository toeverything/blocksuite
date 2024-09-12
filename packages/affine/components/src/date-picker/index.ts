import { DatePicker } from './date-picker.js';

export * from './date-picker.js';

export function effects() {
  customElements.define('date-picker', DatePicker);
}
