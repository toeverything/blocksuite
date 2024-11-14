import { mouseSensor } from './mouse.js';

export const defaultActivators = [
  mouseSensor({ activationConstraint: { distance: 6 } }),
];
